import { LedgerBinary } from "xrpl";
import { Ledger } from "xrpl/dist/npm/models/ledger";

export type XrplBlocksIndexerEvents<Binary extends boolean = false> = {
    Ledger: (ledger: Binary extends false ? Ledger : LedgerBinary) => Promise<void> | void;
};
