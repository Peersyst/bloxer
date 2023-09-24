import type { AccountTxTransaction, Transaction } from "xrpl";
import type { Difference } from "./utils.types";

export type AccountTransaction<T extends Transaction = Transaction> = Omit<AccountTxTransaction, "tx"> & {
    tx: Difference<AccountTxTransaction["tx"], Transaction> & T;
    meta: Exclude<AccountTxTransaction["meta"], string>;
};
