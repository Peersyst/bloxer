import { XrplLedgersIndexer } from "@bloxer/xrpl-ledgers";

async function drill() {
    const indexer = new XrplLedgersIndexer({
        wsUrl: "wss://s1.ripple.com/",
        stateFilePath: "state/.xrpl-blocks-indexer-state.json",
    });
    indexer.on("Ledger", (ledger) => {
        // eslint-disable-next-line no-console
        console.log(`Ledger [${ledger.ledger_index}]: `, ledger.ledger_hash);
    });
    await indexer.run();
}

drill();
