import { XrplAccountIndexer } from "@bloxer/xrpl-account";

async function drill() {
    const indexer = new XrplAccountIndexer("rEAjhZHotzo2jqPbjFpAEacgwc5XoUppgo", {
        wsUrl: "wss://sidechain-net1.devnet.rippletest.net",
        stateFilePath: "state/.xrpl-account-indexer-state.json",
    });
    indexer.on("XChainCreateBridge", (transaction) => {
        // eslint-disable-next-line no-console
        console.log("Found XChainCreateBridge 🥳", transaction.tx.hash);
    });
    await indexer.run();
}

drill();
