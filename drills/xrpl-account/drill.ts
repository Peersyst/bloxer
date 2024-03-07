import { XrplAccountIndexer } from "@bloxer/xrpl-account";

async function drill() {
    const indexer = new XrplAccountIndexer("rEAjhZHotzo2jqPbjFpAEacgwc5XoUppgo", {
        wsUrl: "wss://s.devnet.rippletest.net:51233",
        persistenceFilePath: "persistence/.xrpl-account-indexer.db",
        persist: false,
        startingBlock: "latest",
    });
    indexer.on("XChainCreateBridge", (transaction) => {
        // eslint-disable-next-line no-console
        console.log("Found XChainCreateBridge 🥳", transaction.tx.hash);
    });
    await indexer.run();
}

drill();
