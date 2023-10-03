import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";
import { LedgerBinary, LedgerRequest } from "xrpl";
import { Ledger } from "xrpl/dist/npm/models/ledger";

export type XrplLedgersIndexerRequestOptions = Pick<
    LedgerRequest,
    "full" | "transactions" | "accounts" | "expand" | "owner_funds" | "binary" | "queue"
>;

export type XrplLedgersIndexerConfig = ExtendedIndexerConfig<XrplLedgersIndexerRequestOptions>;

export type XrplLedgersIndexerState = ExtendedIndexerState<{ ledger: Ledger | LedgerBinary }>;

export type XrplLedgersIndexerIndexOptions = ExtendedIndexOptions<{}>;
