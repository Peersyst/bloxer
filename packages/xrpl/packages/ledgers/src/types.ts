import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";
import { LedgerRequest } from "xrpl";

export type XrplLedgersIndexerRequestOptions = Pick<
    LedgerRequest,
    "full" | "transactions" | "accounts" | "expand" | "owner_funds" | "binary" | "queue"
>;

export type XrplLedgersIndexerConfig = ExtendedIndexerConfig<XrplLedgersIndexerRequestOptions>;

export type XrplLedgersIndexerState = ExtendedIndexerState<{}>;

export type XrplLedgersIndexerIndexOptions = ExtendedIndexOptions<{}>;
