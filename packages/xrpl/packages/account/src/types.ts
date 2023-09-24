import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";

export type XrplAccountIndexerConfig = ExtendedIndexerConfig<{
    /**
     * The number of transactions to fetch per batch.
     * @default 10000
     */
    transactionsBatchSize?: number;
}>;

export type XrplAccountIndexerState = ExtendedIndexerState<{}>;

export type XrplAccountIndexerIndexOptions = ExtendedIndexOptions<{}>;
