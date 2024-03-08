import { Inherited } from "./utils/types";
import { AnyObject, OmitRequired } from "@swisstype/essential";
import { Provider } from "./Provider";
import { ISettingsParam as LoggerConfig } from "tslog";

export type IndexerConfig = {
    /**
     * The WebSocket URL of the node to connect to.
     */
    wsUrl: string;
    /**
     * The starting block to index from.
     * @default 0
     */
    startingBlock?: number | undefined | "latest";
    /**
     * The ending block to index to.
     * @default "latest"
     */
    endingBlock?: number | undefined | "latest";
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
     * The path to the persistence file.
     * @default "./bloxer.db"
     */
    persistenceFilePath?: string;
    /**
     * Whether to persist enable persistence.
     * @default true
     */
    persist?: boolean;
};

export type IndexerDefaultConfig = Required<OmitRequired<IndexerConfig>>;

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

export type InheritedIndexOptions<T> = Inherited<IndexOptions, T>;

export type InheritedIndexerConfig<T> = Inherited<IndexerConfig, T>;

export type InheritedDefaultIndexerConfig<T> = Inherited<IndexerDefaultConfig, T>;

export type IndexerGenerics = {
    provider: Provider<any>;
    events: Record<string, (...args: any[]) => any>;
    config?: ExtendedIndexerConfig;
    indexOptions?: ExtendedIndexOptions | undefined;
};
