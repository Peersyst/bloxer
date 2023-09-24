import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";
import { EthersProvider } from "./EthersProvider";

export type EthersIndexerConfig = ExtendedIndexerConfig<{}>;

export type EthersIndexerState = ExtendedIndexerState<{}>;

export type EthersIndexerIndexOptions = ExtendedIndexOptions<{}>;

export type EthersIndexerGenerics = {
    provider?: EthersProvider;
    events: Record<string, (...args: any[]) => any>;
    config?: EthersIndexerConfig;
    state?: EthersIndexerState;
    indexOptions?: EthersIndexerIndexOptions;
};
