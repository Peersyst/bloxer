import { XrplAccountIndexer } from "@bloxer/xrpl-account";

async function drill() {
    const indexer = new XrplAccountIndexer("rEAjhZHotzo2jqPbjFpAEacgwc5XoUppgo", {
        wsUrl: "wss://sidechain-net1.devnet.rippletest.net:51233",
        stateFilePath: "state/.xrpl-account-indexer-state.json",
        persistState: false,
        startingBlock: "latest",
    });
    indexer.on("XChainCreateBridge", (transaction) => {
        // eslint-disable-next-line no-console
        console.log("Found XChainCreateBridge 🥳", transaction.tx.hash);
    });
    await indexer.run();
}

drill();
