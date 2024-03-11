import { EthersTypechainContractIndexer } from "@bloxer/ethers-typechain-contract";
import { BridgeDoorCommon__factory } from "@peersyst/xrp-evm-contracts";
import { appendFile } from "fs-extra";

async function drill() {
    const indexer = new EthersTypechainContractIndexer("0xa6262F3c85617a1Bd17d5a82153A2c6e69AEcfeD", BridgeDoorCommon__factory, {
        wsUrl: "ws://168.119.63.112:8546",
        persistenceFilePath: "persistence/.ethers-typechain-contract-indexer.db",
        startingBlock: 4900000,
        endingBlock: 6935496,
        persist: true,
        logger: {
            minLevel: 3,
        },
    });
    indexer.on("AddClaimAttestation", async (event) => {
        console.log("Found AddClaimAttestation event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("AddClaimAttestation", event.transactionHash, event.logIndex);
    });
    indexer.on("AddCreateAccountAttestation", async (event) => {
        console.log("Found AddCreateAccountAttestation event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("AddCreateAccountAttestation", event.transactionHash, event.logIndex);
    });
    indexer.on("Claim", async (event) => {
        console.log("Found Claim event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("Claim", event.transactionHash, event.logIndex);
    });
    indexer.on("Commit", async (event) => {
        console.log("Found Commit event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("Commit", event.transactionHash, event.logIndex);
    });
    indexer.on("CommitWithoutAddress", async (event) => {
        console.log("Found CommitWithoutAddress event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("CommitWithoutAddress", event.transactionHash, event.logIndex);
    });
    indexer.on("CreateAccount", async (event) => {
        console.log("Found CreateAccount event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("CreateAccount", event.transactionHash, event.logIndex);
    });
    indexer.on("CreateAccountCommit", async (event) => {
        console.log("Found CreateAccountCommit event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("CreateAccountCommit", event.transactionHash, event.logIndex);
    });
    indexer.on("CreateBridge", async (event) => {
        console.log("Found CreateBridge event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("CreateBridge", event.transactionHash, event.logIndex);
    });
    indexer.on("CreateClaim", async (event) => {
        console.log("Found CreateClaim event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("CreateClaim", event.transactionHash, event.logIndex);
    });
    indexer.on("Credit", async (event) => {
        console.log("Found Credit event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("Credit", event.transactionHash, event.logIndex);
    });
    indexer.on("OwnershipTransferred", async (event) => {
        console.log("Found OwnershipTransferred event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("OwnershipTransferred", event.transactionHash, event.logIndex);
    });
    indexer.on("Paused", async (event) => {
        console.log("Found Paused event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("Paused", event.transactionHash, event.logIndex);
    });
    indexer.on("Unpaused", async (event) => {
        console.log("Found Unpaused event");
        await appendFile(
            "./dif-final-boss.txt",
            `${event.event} ${event.transactionHash} ${event.logIndex} ${event.blockNumber} ${JSON.stringify(event)}\n`,
        );
        indexer.eventDone("Unpaused", event.transactionHash, event.logIndex);
    });
    const startDate = new Date();
    await indexer.run();
    const endDate = new Date();
    console.log(`Indexing took ${endDate.getTime() - startDate.getTime()} ms`);
}

drill();
