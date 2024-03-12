import { ExtendedIndexOptions, ExtendedIndexerConfig } from "@bloxer/vanilla";
import { LedgerRequest } from "xrpl";
import { XrplLedgersIndexerEvents } from "./events";

export type XrplLedgersIndexerRequestOptions = Pick<
    LedgerRequest,
    "full" | "transactions" | "accounts" | "expand" | "owner_funds" | "binary" | "queue"
>;

export type SelectedLedgerType = Parameters<XrplLedgersIndexerEvents<XrplLedgersIndexerConfig["requestOptions"]["binary"]>["Ledger"]>[0];

export type XrplLedgersIndexerConfig = ExtendedIndexerConfig<{ requestOptions?: XrplLedgersIndexerRequestOptions }>;

export type XrplLedgersIndexerIndexOptions = ExtendedIndexOptions<{}>;
