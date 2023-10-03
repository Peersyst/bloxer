import { LedgerBinary } from "xrpl";
import { Ledger } from "xrpl/dist/npm/models/ledger";

export type XrplBlocksIndexerEvents = {
    Ledger: (ledger: Ledger | LedgerBinary) => Promise<void> | void;
};
