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
                this.emit("Ledger", res.result.ledger as SelectedLedgerType);
                ++currentBlock;
            }

            // TODO: Implement with db in https://www.notion.so/1930f38fb1e94f82845dab04ac1caeca?v=64f1d5da841741cf9cb3b831e5b493e3&p=9d8b6213e44d4c1e8f2c805565bb2486&pm=s
            // this.setState({
            //   hash: res.result.ledger.ledger_hash
            //     block: res.result.ledger.ledger_index,
            // } as InheritedIndexerState<Generics["state"]>);
        }

        const nextLedger = currentBlock;

        return nextLedger;
    }
}
