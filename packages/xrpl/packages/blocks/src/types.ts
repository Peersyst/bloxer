import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";
import { LedgerBinary, LedgerRequest } from "xrpl";
import { Ledger } from "xrpl/dist/npm/models/ledger";

export type XrplBlocksIndexerRequestOptions = Pick<
    LedgerRequest,
    "full" | "transactions" | "accounts" | "expand" | "owner_funds" | "binary" | "queue"
>;

export type XrplBlocksIndexerConfig = ExtendedIndexerConfig<{}>;

export type XrplBlocksIndexerState = ExtendedIndexerState<{ ledger: Ledger | LedgerBinary }>;

export type XrplBlocksIndexerIndexOptions = ExtendedIndexOptions<XrplBlocksIndexerRequestOptions>;
