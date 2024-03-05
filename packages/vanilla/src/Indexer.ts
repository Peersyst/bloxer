import { Logger } from "tslog";
import { withRetries, deepmerge } from "./utils";
import { IndexerStateRepository } from "./IndexerState.repository";
import { EventEmitter } from "./EventEmitter";
import {
    IndexOptions,
    IndexerGenerics,
    IndexerConfig,
    DefaultExtendedIndexerConfig,
    IndexerDefaultConfig,
    InheritedIndexerConfig,
    InheritedIndexerState,
} from "./types";
import { ProviderConstructor } from "./Provider";

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
        stateFilePath: ".bloxer-indexer.state.json",
        persistState: true,
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

    private readonly indexerStateRepository: IndexerStateRepository<InheritedIndexerState<Generics["state"]>>;

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
     * Gets the state or a nested property from the state.
     */
    protected readonly getState: IndexerStateRepository<InheritedIndexerState<Generics["state"]>>["get"];

    /**
     * Sets the state.
     */
    protected readonly setState: IndexerStateRepository<InheritedIndexerState<Generics["state"]>>["set"];

    /**
     * Sets a partial state.
     */
    protected readonly setPartialState: IndexerStateRepository<InheritedIndexerState<Generics["state"]>>["setPartial"];

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
        this.indexerStateRepository = new IndexerStateRepository({
            stateFilePath: this.config.stateFilePath,
            persistState: this.config.persistState,
        });

        this.on = this.eventEmitter.on.bind(this.eventEmitter);
        this.emit = this.eventEmitter.emit.bind(this.eventEmitter);
        this.getState = this.indexerStateRepository.get.bind(this.indexerStateRepository);
        this.setState = this.indexerStateRepository.set.bind(this.indexerStateRepository);
        this.setPartialState = this.indexerStateRepository.setPartial.bind(this.indexerStateRepository);
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
        await this._provider.disconnect();

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
     * Transforms the state into index options
     * @param state The state
     * @returns The index options
     */
    protected indexOptionsFromState(state: InheritedIndexerState<Generics["state"]>): IndexOptions {
        return {
            startingBlock: state.block,
            previousTransaction: state.transaction,
        };
    }

    /**
     * Runs the indexer
     */
    async run(): Promise<void> {
        await this.initializeProvider();

        let state = this.getState() as InheritedIndexerState<Generics["state"]>;
        let nextBlock;
        this.running = true;

        while (this.running) {
            this.latestBlock = await this.latestBlockPromise;
            if (nextBlock !== undefined ? nextBlock <= this.latestBlock : !state.block || state.block <= this.latestBlock) {
                const fromBlock =
                    nextBlock ?? state.block ?? (this.config.startingBlock === "latest" ? this.latestBlock : this.config.startingBlock);
                const indexingFrom = fromBlock ?? "genesys";
                this.logger.info(`Indexing from block ${indexingFrom} to latest`);
                try {
                    nextBlock = await this.index(
                        nextBlock !== undefined ? { startingBlock: nextBlock } : this.indexOptionsFromState({ block: fromBlock, ...state }),
                    );
                    this.setState({
                        block: nextBlock,
                    } as InheritedIndexerState<Generics["state"]>);
                    this.logger.info(`Indexed blocks from ${indexingFrom} to ${nextBlock - 1} (latest)`);
                } catch (e) {
                    this.logger.error(`Indexing from block ${indexingFrom} to latest failed with error ${e}`);
                    this.logger.info(`Retrying indexing from block ${indexingFrom} to latest...`);
                    state = this.getState() as InheritedIndexerState<Generics["state"]>;
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
            await this.unsubscribeFromLatestBlock();
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
