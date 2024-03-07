import { XrplIndexer, XrplProvider } from "@bloxer/xrpl";
import { XrplLedgersIndexerEvents } from "./events";
import { SelectedLedgerType, XrplLedgersIndexerConfig, XrplLedgersIndexerIndexOptions } from "./types";

export class XrplLedgersIndexer extends XrplIndexer<{
    provider: XrplProvider;
    events: XrplLedgersIndexerEvents<XrplLedgersIndexerConfig["requestOptions"]["binary"]>;
    config: XrplLedgersIndexerConfig;
    indexOptions: XrplLedgersIndexerIndexOptions;
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "XrplLedgersIndexer",
            },
            persistenceFilePath: "./.xrpl-ledgers-indexer.db",
        } as typeof this.defaultConfig);
    }

    constructor(config: XrplLedgersIndexerConfig) {
        super(config);
    }

    async index({ startingBlock, endingBlock = this.latestBlock }: XrplLedgersIndexerIndexOptions): Promise<number> {
        let currentBlock = startingBlock;

        while (currentBlock <= endingBlock) {
            // Fetch currentBlock data
            const res = await this.request({
                command: "ledger",
                ledger_index: currentBlock,
                ...this.config.requestOptions,
            });

            if (res.result.validated) {
                this.notifyEvent("Ledger", res.result.ledger_hash, res.result.ledger_index, res.result.ledger as SelectedLedgerType);
                ++currentBlock;
            }

            // TODO: Should we add a delay here?
        }

        const nextLedger = currentBlock;

        return nextLedger;
    }
}
