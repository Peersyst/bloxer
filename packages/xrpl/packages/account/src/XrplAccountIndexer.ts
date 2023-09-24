import { XrplIndexer, XrplProvider } from "@bloxer/xrpl";
import { XrplAccountIndexerEvents } from "./events";
import { XrplAccountIndexerConfig, XrplAccountIndexerState, XrplAccountIndexerIndexOptions } from "./types";
import { isValidAddress } from "xrpl";
import { AccountTransaction } from "./xrpl.types";

export class XrplAccountIndexer extends XrplIndexer<{
    provider: XrplProvider;
    events: XrplAccountIndexerEvents;
    config: XrplAccountIndexerConfig;
    state: XrplAccountIndexerState;
    indexOptions: XrplAccountIndexerIndexOptions;
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "XrplAccountIndexer",
            },
            stateFilePath: "./.xrpl-account-indexer-state.json",
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
                            this.setPartialState({
                                transaction: tx.hash,
                                block: tx.ledger_index,
                            });
                            // TODO: What happens if some handlers can treat the tx but others can't (Edge case)
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
