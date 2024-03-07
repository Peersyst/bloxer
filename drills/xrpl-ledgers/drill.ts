import { XrplLedgersIndexer } from "@bloxer/xrpl-ledgers";

async function drill() {
    const indexer = new XrplLedgersIndexer({
        wsUrl: "wss://s1.ripple.com/",
        persistenceFilePath: "persistence/.xrpl-blocks-indexer.db",
        startingBlock: 1000000,
        persist: false,
    });
    indexer.on("Ledger", (ledger) => {
        // eslint-disable-next-line no-console
        indexer.logger.info(`Ledger [${ledger.ledger_index}]: `, ledger.ledger_hash);
    });
    await indexer.run();
}

drill();
