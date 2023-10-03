import { XrplIndexer, XrplProvider } from "@bloxer/xrpl";
import { XrplBlocksIndexerEvents } from "./events";
import { XrplBlocksIndexerConfig, XrplBlocksIndexerState, XrplBlocksIndexerIndexOptions } from "./types";

export class XrplBlocksIndexer extends XrplIndexer<{
    provider: XrplProvider;
    events: XrplBlocksIndexerEvents;
    config: XrplBlocksIndexerConfig;
    state: XrplBlocksIndexerState;
    indexOptions: XrplBlocksIndexerIndexOptions;
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "XrplBlocksIndexer",
            },
            stateFilePath: "./.xrpl-blocks-indexer-state.json",
        } as typeof this.defaultConfig);
    }

    constructor(config: XrplBlocksIndexerConfig) {
        super(config);
    }

    async index({ startingBlock, endingBlock, ...requestProps }: XrplBlocksIndexerIndexOptions): Promise<number> {
        let currentBlock = startingBlock;

        do {
            // Fetch currentBlock data
            const res = await this.request({
                command: "ledger",
                ledger_index: currentBlock,
                ...requestProps,
            });

            if (res.result.validated) {
                this.emit("Ledger", res.result.ledger);
                this.setPartialState({ block: res.result.ledger_index, ledger: res.result.ledger });
                ++currentBlock;
            }
        } while (currentBlock <= endingBlock);

        const nextLedger = currentBlock + 1;

        return nextLedger;
    }
}
