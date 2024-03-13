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
    indexer.on("AddClaimAttestation", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found AddClaimAttestation event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("AddClaimAttestation", hash, i);
    });
    indexer.on("AddCreateAccountAttestation", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found AddCreateAccountAttestation event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("AddCreateAccountAttestation", hash, i);
    });
    indexer.on("Claim", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found Claim event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("Claim", hash, i);
    });
    indexer.on("Commit", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found Commit event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("Commit", hash, i);
    });
    indexer.on("CommitWithoutAddress", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found CommitWithoutAddress event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("CommitWithoutAddress", hash, i);
    });
    indexer.on("CreateAccount", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found CreateAccount event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("CreateAccount", hash, i);
    });
    indexer.on("CreateAccountCommit", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found CreateAccountCommit event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("CreateAccountCommit", hash, i);
    });
    indexer.on("CreateBridge", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found CreateBridge event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("CreateBridge", hash, i);
    });
    indexer.on("CreateClaim", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found CreateClaim event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("CreateClaim", hash, i);
    });
    indexer.on("Credit", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found Credit event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("Credit", hash, i);
    });
    indexer.on("OwnershipTransferred", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found OwnershipTransferred event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("OwnershipTransferred", hash, i);
    });
    indexer.on("Paused", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found Paused event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("Paused", hash, i);
    });
    indexer.on("Unpaused", async (event, { event: eventKey, hash, i, block }) => {
        console.log("Found Unpaused event");
        await appendFile("./bridge-events.txt", `${eventKey} ${hash} ${i} ${block} ${JSON.stringify(event)}\n`);
        indexer.eventDone("Unpaused", hash, i);
    });
    const startDate = new Date();
    await indexer.run();
    const endDate = new Date();
    console.log(`Indexing took ${endDate.getTime() - startDate.getTime()} ms`);
}

drill();
