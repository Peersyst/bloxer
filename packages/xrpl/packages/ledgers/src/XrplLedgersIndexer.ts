import { XrplIndexer, XrplProvider } from "@bloxer/xrpl";
import { XrplLedgersIndexerEvents } from "./events";
import { SelectedLedgerType, XrplLedgersIndexerConfig, XrplLedgersIndexerIndexOptions, XrplLedgersIndexerState } from "./types";

export class XrplLedgersIndexer extends XrplIndexer<{
    provider: XrplProvider;
    events: XrplLedgersIndexerEvents<XrplLedgersIndexerConfig["requestOptions"]["binary"]>;
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

        while (currentBlock <= endingBlock) {
            // Fetch currentBlock data
            const res = await this.request({
                command: "ledger",
                ledger_index: currentBlock,
                ...this.config.requestOptions,
            });

            if (res.result.validated) {
                this.emit("Ledger", res.result.ledger as SelectedLedgerType);
                ++currentBlock;
            }
        }

        const nextLedger = currentBlock + 1;

        return nextLedger;
    }
}
