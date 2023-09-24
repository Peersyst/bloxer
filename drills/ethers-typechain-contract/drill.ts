import { EthersTypechainContractIndexer } from "@bloxer/ethers-typechain-contract";
import { BridgeDoorCommon__factory } from "@peersyst/xrp-evm-contracts";

async function drill() {
    const indexer = new EthersTypechainContractIndexer("0x0FCCFB556B4aA1B44F31220AcDC8007D46514f31", BridgeDoorCommon__factory, {
        wsUrl: "wss://ws-evm-poa-sidechain.peersyst.tech",
        stateFilePath: "state/.ethers-typechain-contract-indexer-state.json",
    });
    await indexer.run();
}

drill();
