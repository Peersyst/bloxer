import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";
import { XrplProvider } from "./XrplProvider";

export type XrplIndexerConfig = ExtendedIndexerConfig<{}>;

export type XrplIndexerState = ExtendedIndexerState<{}>;

export type XrplIndexerIndexOptions = ExtendedIndexOptions<{}>;

export type XrplIndexerGenerics = {
    provider?: XrplProvider;
    events: Record<string, (...args: any[]) => any>;
    config?: XrplIndexerConfig;
    state?: XrplIndexerState;
    indexOptions?: XrplIndexerIndexOptions;
};
