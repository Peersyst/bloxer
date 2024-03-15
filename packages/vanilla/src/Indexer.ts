import { Logger } from "tslog";
import { withRetries, deepmerge } from "./utils";
import { EventEmitter } from "./events/EventEmitter";
import {
    IndexerGenerics,
    IndexerConfig,
    DefaultExtendedIndexerConfig,
    IndexerDefaultConfig,
    InheritedIndexerConfig,
    IndexOptions,
} from "./types";
import { ProviderConstructor } from "./Provider";
import { DB } from "./db/interfaces";
import { SQLiteDB } from "./db/SQLiteDB";
import { LastEvent, PendingEvent } from "./db/entities";
import { Mutex } from "async-mutex";
import { ListenerWithEventInfo, EventsWithEventInfo, EventInfo } from "./EventInfo";

export abstract class Indexer<Generics extends IndexerGenerics> {
    /**
     * The default config of the indexer.
     */
    private _defaultConfig: IndexerDefaultConfig = {
        startingBlock: 0,
        endingBlock: "latest",
        reconnectTimeout: 5000,
        maxReconnectAttempts: 10,
        maxRequestRetries: 10,
        requestRetryTimeout: 5000,
        logger: {
            name: "Bloxer Indexer",
            prettyLogTemplate: "{{dd}}-{{mm}}-{{yyyy}} {{hh}}:{{MM}}:{{ss}}:{{ms}} {{name}} {{logLevelName}} ",
            prettyLogTimeZone: "local",
        },
        persistenceFilePath: ".bloxer-indexer.db",
        persist: true,
    };
    protected get defaultConfig(): DefaultExtendedIndexerConfig<InheritedIndexerConfig<Generics["config"]>> {
        // Children will get the right type
        return this._defaultConfig as any;
    }
    private set defaultConfig(value: DefaultExtendedIndexerConfig<InheritedIndexerConfig<Generics["config"]>>) {
        // Children will get the right type
        this._defaultConfig = value as any;
    }

    /**
     * Overrides the default config or adds new properties.
     * this.mergeDefaultConfig can be used to merge the default config with the provided config.
     * IMPORTANT: super.overrideDefaultConfig(defaultConfig) must be called first.
     * @param defaultConfig A reference to the default config
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected overrideDefaultConfig(defaultConfig: DefaultExtendedIndexerConfig<InheritedIndexerConfig<Generics["config"]>>): void {}

    /**
     * Merges the default config with the provided config.
     * @param defaultConfig The provided default config
     */
    protected mergeDefaultConfig(defaultConfig: DefaultExtendedIndexerConfig<InheritedIndexerConfig<Generics["config"]>>): void {
        if (Object.keys(defaultConfig).length > 0) {
            this.defaultConfig = deepmerge(this.defaultConfig, defaultConfig) as typeof this.defaultConfig;
        }
    }

    /**
     * The config of the indexer.
     */
    private _config: Required<InheritedIndexerConfig<Generics["config"]>>;
    protected get config(): Required<InheritedIndexerConfig<Generics["config"]>> {
        return this._config;
    }
    private set config(value: Required<InheritedIndexerConfig<Generics["config"]>>) {
        this._config = value;
    }

    /**
     * The logger of the indexer.
     */
    readonly logger: Logger<any>;

    /**
     * The event emitter of the indexer.
     */
    private readonly eventEmitter = new EventEmitter<EventsWithEventInfo<Generics["events"]>>();
    /**
     * Contains the active event listeners for each event. That is, the subscribed events using the `on` method.
     */
    private readonly activeEventListeners: Partial<Record<keyof Generics["events"], number>> = {};

    /**
     * Reference to the provider.
     */
    private _provider: Generics["provider"];

    /**
     * Reference to the database.
     */
    private readonly db: DB;

    /**
     * A mutex used to ensure that only one new pending event is saved at a time.
     * There could be a race condition where last event 2 is saved before last event 1.
     */
    private readonly eventMutex = new Mutex();

    /**
     * The number of reconnect retries
     */
    private reconnectRetries = 0;

    /**
     * Provider (connection) promises
     */
    private resolveProviderPromise: () => void;
    private providerPromise: Promise<void>;

    /**
     * Block promises
     */
    private resolveLatestBlockPromise: (block: number) => void;
    private latestBlockPromise: Promise<number>;
    protected latestBlock: number;

    /**
     * Whether the indexer is running
     */
    running = false;

    /**
     * The last event processed before the indexer is started.
     */
    private lastEvent: LastEvent | undefined;

    /**
     * Whether the last event has been reached and new events can be processed.
     */
    private reachedLastEvent = false;

    /**
     * Requests the provider with retries
     * Acts as a wrapper for provider.request
     */
    protected request: Generics["provider"]["request"];

    constructor(
        private readonly Provider: ProviderConstructor<Generics["provider"]>,
        config: Generics["config"],
    ) {
        this.resetProviderPromise();
        this.resetLatestBlockPromise();
        this.validateConfig(config);
        this.overrideDefaultConfig(this.defaultConfig as DefaultExtendedIndexerConfig<InheritedIndexerConfig<Generics["config"]>>);
        this.config = deepmerge(this.defaultConfig, config) as typeof this.config;
        this.logger = new Logger(this.config.logger);
        this.db = new SQLiteDB(this.config.persistenceFilePath);

        this.request = async function request(...args: any[]) {
            return this.withRetries(
                async () => {
                    const client = await this.getProvider();
                    return client.request(...args);
                },
                (e) => this.logger.warn(`Request with args ${JSON.stringify(args)} failed with error ${e}, retrying...`),
            );
        }.bind(this);
    }

    /**
     * Wrapper for withRetries with default values
     */
    protected withRetries<T>(
        fn: () => T,
        onRetry?: (error: any) => void,
        maxRetries: number = this.config.maxRequestRetries,
        timeout: number = this.config.requestRetryTimeout,
    ): Promise<Awaited<T>> {
        return withRetries(fn, maxRetries, timeout, onRetry);
    }

    /**
     * Resets the provider promise
     */
    private resetProviderPromise(): void {
        this.providerPromise = new Promise((resolve) => {
            this.resolveProviderPromise = resolve;
        });
    }

    /**
     * Resets the latest block promise
     */
    private resetLatestBlockPromise(): void {
        this.latestBlockPromise = new Promise((resolve) => {
            this.resolveLatestBlockPromise = resolve;
        });
    }

    /**
     * Validates the config and throws errors if invalid
     * @param config The config to validate
     */
    private validateConfig(config: IndexerConfig): void {
        if (typeof config.wsUrl !== "string" || !/wss?(?:\+unix)?:\/\//u.exec(config.wsUrl)) {
            throw new Error("Node url must start with `wss://`, `ws://`, `wss+unix://`, or `ws+unix://`.");
        }

        if (
            config.startingBlock &&
            (typeof config.startingBlock === "number" ? config.startingBlock < 0 : config.startingBlock !== "latest")
        ) {
            throw new Error("Starting block must be greater than or equal to 0 or 'latest'.");
        }

        if (config.reconnectTimeout && config.reconnectTimeout < 0) {
            throw new Error("Reconnect timeout must be greater than or equal to 0.");
        }

        if (config.maxReconnectAttempts && config.maxReconnectAttempts < 0) {
            throw new Error("Maximum reconnect attempts must be greater than or equal to 0.");
        }

        if (config.maxRequestRetries && config.maxRequestRetries < 0) {
            throw new Error("Maximum reconnect attempts must be greater than or equal to 0.");
        }

        if (config.requestRetryTimeout && config.requestRetryTimeout < 0) {
            throw new Error("Maximum reconnect attempts must be greater than or equal to 0.");
        }
    }

    /**
     * Getter for the Provider
     */
    async getProvider(): Promise<Generics["provider"]> {
        await this.providerPromise;

        return this._provider;
    }

    /**
     * Initializes the provider
     */
    private async initializeProvider(): Promise<void> {
        this.logger.info(`Connecting to ${this.config.wsUrl}`);

        this._provider = new this.Provider(this.config.wsUrl);

        this._provider.on("connected", () => {
            this.logger.info(`Connected to ${this.config.wsUrl}`);
            this.reconnectRetries = 0;
            this.resolveProviderPromise();
        });

        this._provider.on("disconnected", () => {
            this.resetProviderPromise();
            this.logger.warn(`Disconnected from ${this.config.wsUrl}`);
            this.reconnectProvider();
        });

        this._provider.on("error", (error) => {
            this.logger.error(`Error from ${this.config.wsUrl}: ${error}`);
        });

        this._provider.on("block", (block) => {
            this.logger.debug(`Latest block: ${block}`);
            this.resolveLatestBlockPromise(block);
            this.resetLatestBlockPromise();
        });

        try {
            this._provider.connect();
            this._provider.setListeners();
            await this._provider.waitConnection();
            await this.subscribeToLatestBlock();
        } catch (_e) {
            await this.reconnectProvider();
        }
    }

    /**
     * Reconnects the provider
     */
    private async reconnectProvider(): Promise<void> {
        this.logger.debug(`Reconnect to ${this.config.wsUrl}`);

        await this._provider.disconnect();

        this.logger.debug(`Disconnected from ${this.config.wsUrl} before trying to reconnect`);

        while (!this._provider.isConnected()) {
            this.reconnectRetries++;

            if (this.reconnectRetries > this.config.maxReconnectAttempts) {
                this.logger.error(`Could not reach ${this.config.wsUrl}`);
                break;
            }

            this.logger.warn(`Reconnecting to ${this.config.wsUrl}... (${this.reconnectRetries})`);

            await new Promise((resolve) => setTimeout(resolve, this.config.reconnectTimeout));

            try {
                await this.initializeProvider();
            } catch (_e) {}
        }
    }

    /**
     * Subscribes to the latest block
     */
    private async subscribeToLatestBlock(): Promise<void> {
        try {
            const provider = await this.getProvider();

            await this.withRetries(
                async () => {
                    await provider.subscribeToLatestBlock();
                },
                (e) => this.logger.warn(`Subscribe to latest block failed with error ${e}, retrying...`),
            );

            this.logger.info("Subscribed to validated blocks");
        } catch (e) {
            this.logger.error(`Subscribe to latest block failed with error ${e}`);
            throw e;
        }
    }

    /**
     * Unsubscribes from the latest block
     */
    private async unsubscribeFromLatestBlock(): Promise<void> {
        try {
            const provider = await this.getProvider();

            await this.withRetries(
                async () => {
                    await provider.unsubscribeFromLatestBlock();
                },
                (e) => this.logger.warn(`Unsubscribe from latest block failed with error ${e}, retrying...`),
            );
        } catch (e) {
            this.logger.error(`Unsubscribe from latest block failed with error ${e}`);
        }
    }

    /**
     * Opens the database connection if `persist` is true.
     */
    private async openDB(): Promise<void> {
        if (this.config.persist) {
            await this.db.open();
        }
    }

    /**
     * Closes the database connection if `persist` is true.
     */
    private async closeDB(): Promise<void> {
        if (this.config.persist) {
            await this.db.close();
        }
    }

    /**
     * Gets the starting block.
     * @returns The starting block.
     */
    private getStartingBlock(): number {
        if (this.lastEvent) {
            return this.lastEvent.block;
        } else {
            return this.config.startingBlock === "latest" ? this.latestBlock : this.config.startingBlock;
        }
    }

    /**
     * Gets the ending block.
     * @returns The ending block.
     */
    private getEndingBlock(): number {
        return this.config.endingBlock === "latest" ? this.latestBlock : this.config.endingBlock;
    }

    /**
     * Gets index options.
     * @param nextBlock The next block.
     * @param lastEvent The last event.
     * @returns The index options.
     */
    private getIndexOptions(nextBlock: number | undefined): Required<IndexOptions> {
        return {
            startingBlock: nextBlock ?? this.getStartingBlock(),
            endingBlock: this.getEndingBlock(),
        };
    }

    /**
     * Checks if indexer can index.
     * The indexer can index if the staring block is less than or equal to the latest block.
     * @param indexOptions The index options.
     * @returns Whether the indexer can index.
     */
    private async canIndex({ startingBlock, endingBlock }: Required<IndexOptions>): Promise<boolean> {
        if (this.lastEvent && this.lastEvent.block > this.latestBlock) {
            this.logger.fatal(
                `Last event block ${this.lastEvent.block} is greater than the latest block ${this.latestBlock}. This should never happen and could mean that the database data has not been stored correctly or is corrupted.`,
            );
            await this.stop();
            return false;
        } else if (startingBlock > endingBlock) {
            this.logger.info(`Indexing to block ${endingBlock} completed.`);
            await this.stop();
            return false;
        } else {
            return true;
        }
    }

    /**
     * Saves a new pending event by saving the last event and creating a new pending event.
     * Uses a mutex to ensure that only one pending event is saved at a time.
     * @param event The event to emit.
     * @returns An array containing the last event and the pending event.
     */
    private async saveNewPendingEvent<Event extends string & keyof Generics["events"]>({
        event,
        hash,
        i = 0,
        block,
        data,
    }: PendingEvent<Event, Parameters<Generics["events"][Event]>>): Promise<[LastEvent | void, PendingEvent]> {
        return await this.eventMutex.runExclusive(
            async () =>
                await Promise.all([
                    this.db.getRepository(LastEvent).updateOrCreate({ block, event, hash, i }),
                    this.db.getRepository(PendingEvent).create({ event, hash, i, block, data }),
                ]),
        );
    }

    /**
     * Saves the last indexed block by saving the last event only with the `block + 1`.
     * Uses a mutex to ensure that only one event is saved at a time.
     * @param block The block.
     * @returns An array containing the last event and the pending event.
     */
    private async saveBlock(block: number): Promise<LastEvent | void> {
        return await this.eventMutex.runExclusive(
            async () =>
                await this.db.getRepository(LastEvent).updateOrCreate({ block: block + 1, event: undefined, hash: undefined, i: 0 }),
        );
    }

    /**
     * Creates a pending event if `persist` is true and emits the event.
     * @param event The event to emit.
     */
    protected notifyEvent<Event extends string & keyof Generics["events"]>(
        pendingEvent: PendingEvent<Event, Parameters<Generics["events"][Event]>>,
    ): void {
        if (this.activeEventListeners[pendingEvent.event]) {
            if (this.config.persist) {
                if (this.reachedLastEvent) {
                    this.saveNewPendingEvent(pendingEvent)
                        .then(() => {
                            this.emitEvent(pendingEvent);
                        })
                        .catch((e) => {
                            this.logger.error(
                                `Error while saving new pending event ${pendingEvent.event} with hash ${pendingEvent.hash} and block ${pendingEvent.block}: ${e}`,
                            );
                        });
                } else {
                    // We can assert `this.lastEvent` since it has to be defined for `this.reachedLastEvent` to be false.
                    if (
                        this.lastEvent!.event === pendingEvent.event &&
                        this.lastEvent!.hash === pendingEvent.hash &&
                        (!pendingEvent.i || this.lastEvent.i! === pendingEvent.i)
                    ) {
                        this.reachedLastEvent = true;
                    }
                }
            } else {
                this.emitEvent(pendingEvent);
            }
        }
    }

    /**
     * Notifies the last block processed. It saves the last event only with the `block + 1` if `persist` is true.
     * This method should be called after processing a block or a batch of blocks in order to keep the persistence updated.
     * @param block The block.
     */
    protected notifyBlock(block: number): void {
        if (this.config.persist) {
            /**
             * We assume that the last event is reached.
             * A new block can never be processed if the last event is not reached.
             */
            this.saveBlock(block).catch((e) => {
                this.logger.error(`Error while saving the last block processed ${block}: ${e}`);
            });
        }
    }

    /**
     * Gets the last event processed.
     * @returns The last event processed or undefined if there is no last event.
     */
    private getLastEvent(): Promise<LastEvent | undefined> {
        return this.db.getRepository(LastEvent).findOne();
    }

    /**
     * Gets the pending events.
     * @returns The pending events.
     */
    private getPendingEvents(): Promise<PendingEvent[]> {
        return this.db.getRepository(PendingEvent).findAll();
    }

    /**
     * Recovers the last event processed.
     * Sets `lastEvent` and `reachedLastEvent`.
     */
    private async recoverLastEvent(): Promise<void> {
        if (this.config.persist) {
            this.lastEvent = await this.getLastEvent();
            // If last event is undefined OR it has no event (only contains the last block), last event is reached
            this.reachedLastEvent = !this.lastEvent?.event;
        } else {
            this.lastEvent = undefined;
            this.reachedLastEvent = true;
        }
    }

    /**
     * Recovers the pending events and emits them.
     */
    private async recoverPendingEvents(): Promise<void> {
        if (this.config.persist) {
            const pendingEvents = await this.getPendingEvents();

            for (const pendingEvent of pendingEvents) {
                this.emitEvent(pendingEvent);
            }
        }
    }

    /**
     * Marks an event as done by deleting the pending event.
     * **This method should be called after processing an event.**
     * If not called, the event will persist in the database and will be processed again after a restart.
     * Does nothing when called with `persist` set to `false`.
     * @param event The event.
     * @param hash The hash of the event.
     * @param i The index of the event. Defaults to 0 since events without i are stored with i 0.
     */
    eventDone<Event extends string & keyof Generics["events"]>(event: Event, hash: string, i: number = 0): void {
        if (this.config.persist) {
            this.db.getRepository(PendingEvent).delete({ event, hash, i });
        }
    }

    /**
     * Adds the `listener` function to the end of the listeners array for the specified event.
     * @param event The event.
     * @param listener The callback function.
     * @returns A function that removes the listener.
     */
    on<Event extends string & keyof Generics["events"]>(
        event: Event,
        listener: ListenerWithEventInfo<Event, Generics["events"][Event]>,
    ): () => void {
        // Add the event to the active event listeners
        this.activeEventListeners[event] = (this.activeEventListeners[event] ?? 0) + 1;

        const removeListener = this.eventEmitter.on(event, listener);

        return () => {
            // Remove the event from the active event listeners
            this.activeEventListeners[event] = (this.activeEventListeners[event] ?? 1) - 1;

            removeListener();
        };
    }

    /**
     * Emits an event with the given arguments.
     * @param event The event to emit.
     * @param args The arguments to pass to the event listeners.
     * @returns Returns `true` if the event had listeners, `false` otherwise.
     */
    emit<Event extends keyof Generics["events"]>(event: Event, ...args: Parameters<Generics["events"][Event]>): boolean {
        return this.eventEmitter.emit(event, ...args);
    }

    /**
     * Emits an event from a `PendingEvent`.
     * @param pendingEvent The pending event to emit.
     * @returns Returns `true` if the event had listeners, `false` otherwise.
     */
    emitEvent<Event extends string & keyof Generics["events"]>(pendingEvent: PendingEvent<Event>): boolean {
        return this.eventEmitter.emit(
            pendingEvent.event,
            ...([...pendingEvent.data, EventInfo.fromPendingEvent(pendingEvent)] as Parameters<
                EventsWithEventInfo<Generics["events"]>[Event]
            >),
        );
    }

    /**
     * Runs the indexer
     */
    async run(): Promise<void> {
        this.running = true;

        try {
            // Open db connection and initialize provider
            await Promise.all([this.openDB(), this.initializeProvider()]);
            // Recover the last event
            await this.recoverLastEvent();
            // Recover the pending events
            await this.recoverPendingEvents();
        } catch (e) {
            this.logger.error(`Error while running the indexer: ${e}`);
            await this.stop();
        }

        let nextBlock: number | undefined;

        while (this.running) {
            this.latestBlock = await this.latestBlockPromise;

            const indexOptions = this.getIndexOptions(nextBlock);
            const canIndex = await this.canIndex(indexOptions);

            if (canIndex) {
                const indexingFrom = indexOptions.startingBlock ?? "genesis";

                this.logger.info(`Indexing from block ${indexingFrom} to latest`);

                try {
                    nextBlock = await this.index(indexOptions);

                    this.logger.info(`Indexed blocks from ${indexingFrom} to ${nextBlock - 1} (latest)`);
                } catch (e) {
                    this.logger.error(`Indexing from block ${indexingFrom} to latest failed with error ${e}`);
                    this.logger.info(`Retrying indexing from block ${indexingFrom} to latest...`);
                }
            }
        }
    }

    /**
     * Stops the indexer
     */
    async stop(): Promise<void> {
        if (this.running) {
            this.logger.info("Stopping indexer...");

            this.running = false;
            // Close db connection and unsubscribe from latest block
            await Promise.all([this.closeDB(), this.unsubscribeFromLatestBlock()]);

            this.logger.info("Indexer stopped");
        } else {
            this.logger.warn("Indexer is already stopped");
        }
    }

    /**
     * Indexes the blocks from startingBlock to endingBlock
     * @param options The index options
     * @returns The next block
     */
    abstract index(options: Generics["indexOptions"]): Promise<number>;
}
