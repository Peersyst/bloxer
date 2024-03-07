import { XrplIndexer, XrplProvider } from "@bloxer/xrpl";
import { XrplAccountIndexerEvents } from "./events";
import { XrplAccountIndexerConfig, XrplAccountIndexerIndexOptions } from "./types";
import { isValidAddress } from "xrpl";
import { AccountTransaction } from "./xrpl.types";

export class XrplAccountIndexer extends XrplIndexer<{
    provider: XrplProvider;
    events: XrplAccountIndexerEvents;
    config: XrplAccountIndexerConfig;
    indexOptions: XrplAccountIndexerIndexOptions;
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "XrplAccountIndexer",
            },
            persistenceFilePath: "./.xrpl-account-indexer.db",
            transactionsBatchSize: 10000,
        } as typeof this.defaultConfig);
    }

    constructor(
        private readonly account: string,
        config: XrplAccountIndexerConfig,
    ) {
        if (!isValidAddress(account)) {
            throw new Error("Invalid account address.");
        }

        super(config);
    }

    async index({ startingBlock, endingBlock, previousTransaction }: XrplAccountIndexerIndexOptions): Promise<number> {
        let marker;
        let lastIndexedLedger = startingBlock;
        // TODO: Move to `Indexer` in https://www.notion.so/1930f38fb1e94f82845dab04ac1caeca?v=64f1d5da841741cf9cb3b831e5b493e3&p=fbd10cc7c64f44deb868638b7ac89c86&pm=s
        let reachedPreviousTransaction = !previousTransaction;

        do {
            const res = await this.request({
                command: "account_tx",
                account: this.account,
                ledger_index_min: startingBlock,
                ledger_index_max: endingBlock,
                limit: this.config.transactionsBatchSize,
                forward: true,
                marker,
            });

            if (res.result.validated) {
                // Set the marker for the next request
                marker = res.result.marker;
                // Set the last indexed ledger
                lastIndexedLedger = res.result.ledger_index_max;

                for (const accountTx of res.result.transactions) {
                    const correctlyCastedAccountTx = accountTx as AccountTransaction;
                    // If the transaction is validated and successful index it
                    if (accountTx.validated && correctlyCastedAccountTx.meta.TransactionResult === "tesSUCCESS") {
                        const tx = correctlyCastedAccountTx.tx;

                        // If the previous transaction has been reached the following ones can be indexed. Otherwise, it still needs to be found.
                        if (reachedPreviousTransaction) {
                            const hash = tx.hash;
                            const block = tx.ledger_index;

                            if (hash !== undefined && block !== undefined) {
                                // Notify transaction events
                                this.notifyEvent("Transaction", hash, block, correctlyCastedAccountTx);
                                this.notifyEvent(tx.TransactionType, hash, block, correctlyCastedAccountTx as AccountTransaction<any>);
                            }
                        } else if (tx.hash === previousTransaction) {
                            reachedPreviousTransaction = true;
                        }
                    }
                }
            }
        } while (marker);

        if (!lastIndexedLedger) throw new Error("No ledger has been indexed");

        const nextLedger = lastIndexedLedger + 1;

        return nextLedger;
    }
}
