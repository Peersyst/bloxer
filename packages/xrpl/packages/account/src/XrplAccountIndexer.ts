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
                            // Emit transaction events
                            this.emit("Transaction", correctlyCastedAccountTx);
                            this.emit(tx.TransactionType, correctlyCastedAccountTx as AccountTransaction<any>);
                            // Save the last indexed transaction state
                            // TODO: Implement with db in https://www.notion.so/1930f38fb1e94f82845dab04ac1caeca?v=64f1d5da841741cf9cb3b831e5b493e3&p=9d8b6213e44d4c1e8f2c805565bb2486&pm=s
                            // this.setPartialState({
                            //     transaction: tx.hash,
                            //     block: tx.ledger_index,
                            // });
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
