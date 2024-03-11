import { EthersTypechainContractIndexer } from "@bloxer/ethers-typechain-contract";
import { BridgeDoorCommon__factory } from "@peersyst/xrp-evm-contracts";

async function drill() {
    const indexer = new EthersTypechainContractIndexer("0xa6262F3c85617a1Bd17d5a82153A2c6e69AEcfeD", BridgeDoorCommon__factory, {
        wsUrl: "ws://168.119.63.112:8546",
        persistenceFilePath: "persistence/.ethers-typechain-contract-indexer.db",
        startingBlock: 4000000,
    });
    indexer.on("CreateAccount", (event) => {
        setTimeout(() => {
            indexer.eventDone("CreateAccount", event.transactionHash, event.blockNumber);
        }, 5000);
    });
    await indexer.run();
}

drill();
