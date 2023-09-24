import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";

export type EthersTypechainContractIndexerConfig = ExtendedIndexerConfig<{
    /**
     * The number of blocks to fetch per batch.
     * @default 1000
     */
    blocksBatchSize?: number;
}>;

export type EthersTypechainContractIndexerState = ExtendedIndexerState<{}>;

export type EthersTypechainContractIndexerIndexOptions = ExtendedIndexOptions<{}>;
