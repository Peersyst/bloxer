import { XrplIndexer, XrplProvider } from "@bloxer/xrpl";
import { XrplLedgersIndexerEvents } from "./events";
import { XrplLedgersIndexerConfig, XrplLedgersIndexerIndexOptions, XrplLedgersIndexerState } from "./types";

export class XrplLedgersIndexer extends XrplIndexer<{
    provider: XrplProvider;
    events: XrplLedgersIndexerEvents<XrplLedgersIndexerConfig["binary"]>;
    config: XrplLedgersIndexerConfig;
    state: XrplLedgersIndexerState;
    indexOptions: XrplLedgersIndexerIndexOptions;
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "XrplLedgersIndexer",
            },
            stateFilePath: "./.xrpl-ledgers-indexer-state.json",
        } as typeof this.defaultConfig);
    }

    constructor(config: XrplLedgersIndexerConfig) {
        super(config);
    }

    async index({ startingBlock, endingBlock }: XrplLedgersIndexerIndexOptions): Promise<number> {
        let currentBlock = startingBlock;

        do {
            // Fetch currentBlock data
            const res = await this.request({
                command: "ledger",
                ledger_index: currentBlock,
                full: this.config.full,
                transactions: this.config.transactions,
                accounts: this.config.accounts,
                expand: this.config.expand,
                owner_funds: this.config.owner_funds,
                binary: this.config.binary,
                queue: this.config.queue,
            });

            if (res.result.validated) {
                this.emit(
                    "Ledger",
                    res.result.ledger as Parameters<XrplLedgersIndexerEvents<XrplLedgersIndexerConfig["binary"]>["Ledger"]>[0],
                );
                ++currentBlock;
            }
        } while (currentBlock <= endingBlock);

        const nextLedger = currentBlock + 1;

        return nextLedger;
    }
}
