import { ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";
import { EthersProvider } from "./EthersProvider";

export type EthersIndexerConfig = ExtendedIndexerConfig<{}>;

export type EthersIndexerIndexOptions = ExtendedIndexOptions<{}>;

export type EthersIndexerGenerics = {
    provider?: EthersProvider;
    events: Record<string, (...args: any[]) => any>;
    config?: EthersIndexerConfig;
    indexOptions?: EthersIndexerIndexOptions;
};
