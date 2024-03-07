import { ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";
import { XrplProvider } from "./XrplProvider";

export type XrplIndexerConfig = ExtendedIndexerConfig<{}>;

export type XrplIndexerIndexOptions = ExtendedIndexOptions<{}>;

export type XrplIndexerGenerics = {
    provider?: XrplProvider;
    events: Record<string, (...args: any[]) => any>;
    config?: XrplIndexerConfig;
    indexOptions?: XrplIndexerIndexOptions;
};
