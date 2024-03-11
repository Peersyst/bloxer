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

    async index({ startingBlock, endingBlock }: XrplAccountIndexerIndexOptions): Promise<number> {
        let marker;
        let lastIndexedLedger = startingBlock;

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

                        const hash = tx.hash;
                        const block = tx.ledger_index;

                        if (hash !== undefined && block !== undefined) {
                            // Notify transaction events
                            this.notifyEvent("Transaction", hash, block, correctlyCastedAccountTx);
                            this.notifyEvent(tx.TransactionType, hash, block, correctlyCastedAccountTx as AccountTransaction<any>);
                        }
                    }
                }

                this.notifyBlock(lastIndexedLedger);
            }
        } while (marker);

        if (!lastIndexedLedger) throw new Error("No ledger has been indexed");

        const nextLedger = lastIndexedLedger + 1;

        return nextLedger;
    }
}
