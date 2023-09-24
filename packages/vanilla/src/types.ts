import { AnyObject, Inherited, OmitRequired } from "./utils.types";
import { Provider } from "./Provider";
import { ISettingsParam as LoggerConfig } from "tslog";

export type IndexerConfig = {
    /**
     * The WebSocket URL of the node to connect to.
     */
    wsUrl: string;
    /**
     * The starting block to index from.
     * */
    startingBlock?: number | undefined;
    /**
     * The maximum interval in milliseconds to send a ping request to the node.
     * @default 5000
     */
    reconnectTimeout?: number;
    /**
     * The maximum number of reconnection attempts.
     * @default 10
     */
    maxReconnectAttempts?: number;
    /**
     * The maximum number of request retries.
     * @default 10
     */
    maxRequestRetries?: number;
    /**
     * The timeout in milliseconds to retry a request.
     * @default 5000
     */
    requestRetryTimeout?: number;
    /**
     * The logger configuration.
     */
    logger?: LoggerConfig<any>;
    /**
     * The path to the state file.
     * @default "./bloxer.state.json"
     */
    stateFilePath?: string;
};

export type IndexerDefaultConfig = Required<OmitRequired<IndexerConfig>>;

export type IndexerState = {
    /**
     * The index of the last indexed block.
     */
    block?: number;
    /**
     * The hash of the last indexed transaction.
     */
    transaction?: string;
};

export type ExtendedIndexerState<ExtendedState extends AnyObject | undefined = {}> = (ExtendedState extends undefined
    ? {}
    : Partial<ExtendedState>) &
    IndexerState;

export type IndexOptions = {
    /**
     * The starting block to index from.
     * @default "The starting block set in the config."
     */
    startingBlock?: number;
    /**
     * The ending block to index to.
     * @default "The current block."
     */
    endingBlock?: number;
    /**
     * The hash of the previous transaction.
     */
    previousTransaction?: string;
};

export type ExtendedIndexOptions<ExtendedOptions extends AnyObject | undefined = {}> = (ExtendedOptions extends undefined
    ? {}
    : ExtendedOptions) &
    IndexOptions;

export type ExtendedIndexerConfig<ExtendedConfig extends AnyObject | undefined = {}> = (ExtendedConfig extends undefined
    ? {}
    : ExtendedConfig) &
    IndexerConfig;

export type DefaultExtendedIndexerConfig<ExtendedConfig extends ExtendedIndexerConfig> = Partial<ExtendedConfig>;
// Does not work with generic config for some reason :(
// export type DefaultExtendedIndexerConfig<ExtendedConfig extends ExtendedIndexerConfig> = Required<OmitRequired<ExtendedConfig>>;

export type InheritedIndexerState<T> = Inherited<IndexerState, T>;

export type InheritedIndexOptions<T> = Inherited<IndexOptions, T>;

export type InheritedIndexerConfig<T> = Inherited<IndexerConfig, T>;

export type InheritedDefaultIndexerConfig<T> = Inherited<IndexerDefaultConfig, T>;

export type IndexerGenerics = {
    provider: Provider<any>;
    events: Record<string, (...args: any[]) => any>;
    config?: ExtendedIndexerConfig;
    state?: ExtendedIndexerState;
    indexOptions?: ExtendedIndexOptions | undefined;
};
