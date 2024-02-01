import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";

export type EthersTypechainContractIndexerConfig = ExtendedIndexerConfig<{
    /**
     * The number of blocks to fetch per batch.
     * @default 1000
     */
    blocksBatchSize?: number;
    /**
     * The timeout for throwing an error when fetching events.
     * @default 5000
     */
    getEventsTimeout?: number;
    /**
     * The timeout for retrying to fetch events.
     * @default 5000
     */
    getEventsRetryTimeout?: number;
}>;

export type EthersTypechainContractIndexerState = ExtendedIndexerState<{}>;

export type EthersTypechainContractIndexerIndexOptions = ExtendedIndexOptions<{}>;
