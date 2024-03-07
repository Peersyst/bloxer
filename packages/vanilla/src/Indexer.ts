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

export abstract class Indexer<Generics extends IndexerGenerics> {
    private _defaultConfig: IndexerDefaultConfig = {
        startingBlock: 0,
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

    private _config: Required<InheritedIndexerConfig<Generics["config"]>>;
    protected get config(): Required<InheritedIndexerConfig<Generics["config"]>> {
        return this._config;
    }
    private set config(value: Required<InheritedIndexerConfig<Generics["config"]>>) {
        this._config = value;
    }

    readonly logger: Logger<any>;

    private readonly eventEmitter = new EventEmitter<Generics["events"]>();

    private _provider: Generics["provider"];

    /**
     * Reference to the database.
     */
    private readonly db: DB;

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
     * Event listener for the indexer
     */
    readonly on: EventEmitter<Generics["events"]>["on"];

    /**
     * Event emitter for the indexer
     */
    protected readonly emit: EventEmitter<Generics["events"]>["emit"];

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

        this.on = this.eventEmitter.on.bind(this.eventEmitter);
        this.emit = this.eventEmitter.emit.bind(this.eventEmitter);
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
     * Gets index options.
     * @param nextBlock The next block.
     * @param lastEvent The last event.
     */
    private getIndexOptions(nextBlock: number | undefined, lastEvent: LastEvent | undefined): IndexOptions {
        if (nextBlock) {
            return { startingBlock: nextBlock };
        } else if (lastEvent) {
            return { startingBlock: lastEvent.block, previousTransaction: lastEvent.hash };
        } else {
            return { startingBlock: this.config.startingBlock === "latest" ? this.latestBlock : this.config.startingBlock };
        }
    }

    protected notifyEvent<Event extends keyof Generics["events"]>(
        event: Event,
        hash: string,
        block: number,
        ...data: Parameters<Generics["events"][Event]>
    ): void {
        // TODO: Check if the event is previous to the last event with a `reachedLastEvent` variable in https://www.notion.so/1930f38fb1e94f82845dab04ac1caeca?v=64f1d5da841741cf9cb3b831e5b493e3&p=fbd10cc7c64f44deb868638b7ac89c86&pm=s
        const pendingEventsRepository = this.db.getRepository(PendingEvent);
        pendingEventsRepository
            .create(PendingEvent.fromEventNotification(event as string, hash, block, ...data))
            .then(() => {
                this.emit(event, ...data);
            })
            .catch((e) => {
                this.logger.error(`Error while creating the pending event ${event as string} with hash ${hash} and block ${block}: ${e}`);
            });
    }

    /**
     * Runs the indexer
     */
    async run(): Promise<void> {
        await Promise.all([this.db.open(), this.initializeProvider()]);

        // TODO: Implement with db in https://www.notion.so/1930f38fb1e94f82845dab04ac1caeca?v=64f1d5da841741cf9cb3b831e5b493e3&p=fbd10cc7c64f44deb868638b7ac89c86&pm=s
        let lastEvent = undefined as any;
        let nextBlock: number | undefined;
        this.running = true;

        while (this.running) {
            this.latestBlock = await this.latestBlockPromise;

            if (nextBlock !== undefined ? nextBlock <= this.latestBlock : !lastEvent || lastEvent.block <= this.latestBlock) {
                const indexOptions = this.getIndexOptions(nextBlock, lastEvent);
                const indexingFrom = indexOptions.startingBlock ?? "genesis";

                this.logger.info(`Indexing from block ${indexingFrom} to latest`);

                try {
                    nextBlock = await this.index(indexOptions);

                    this.logger.info(`Indexed blocks from ${indexingFrom} to ${nextBlock - 1} (latest)`);
                } catch (e) {
                    this.logger.error(`Indexing from block ${indexingFrom} to latest failed with error ${e}`);
                    this.logger.info(`Retrying indexing from block ${indexingFrom} to latest...`);

                    // TODO: Implement with db in https://www.notion.so/1930f38fb1e94f82845dab04ac1caeca?v=64f1d5da841741cf9cb3b831e5b493e3&p=fbd10cc7c64f44deb868638b7ac89c86&pm=s
                    lastEvent = undefined;
                    nextBlock = undefined;
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
            await Promise.all([this.db.close(), this.unsubscribeFromLatestBlock()]);

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
