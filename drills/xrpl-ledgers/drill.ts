import { XrplLedgersIndexer } from "@bloxer/xrpl-ledgers";

async function drill() {
    const indexer = new XrplLedgersIndexer({
        wsUrl: "wss://s1.ripple.com/",
        stateFilePath: "state/.xrpl-blocks-indexer-state.json",
        startingBlock: 1000000,
        persistState: false,
    });
    indexer.on("Ledger", (ledger) => {
        // eslint-disable-next-line no-console
        indexer.logger.info(`Ledger [${ledger.ledger_index}]: `, ledger.ledger_hash);
    });
    await indexer.run();
}

drill();
