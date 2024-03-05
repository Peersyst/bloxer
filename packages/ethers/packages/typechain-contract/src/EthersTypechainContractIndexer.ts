import { EthersIndexer } from "@bloxer/ethers";
import { EthersTypechainContractIndexerEvents } from "./events";
import {
    EthersTypechainContractIndexerConfig,
    EthersTypechainContractIndexerState,
    EthersTypechainContractIndexerIndexOptions,
} from "./types";
import { EthersTypechainContractProvider } from "./EthersTypechainContractProvider";
import {
    TypechainContractFactory as GenericTypechainContractFactory,
    TypechainContractInstance,
    TypechainTypedEvent,
} from "./typechain.types";
import { ethers } from "ethers";
import timeoutPromise from "./utils";

export class EthersTypechainContractIndexer<ContractFactory extends GenericTypechainContractFactory> extends EthersIndexer<{
    provider: EthersTypechainContractProvider;
    events: EthersTypechainContractIndexerEvents<ContractFactory>;
    config: EthersTypechainContractIndexerConfig;
    state: EthersTypechainContractIndexerState;
    indexOptions: EthersTypechainContractIndexerIndexOptions;
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "EthersTypechainContractIndexer",
            },
            stateFilePath: "./.ethers-typechain-contract-indexer-state.json",
            blocksBatchSize: 1000,
            getEventsTimeout: 5000,
            getEventsRetryTimeout: 5000,
        } as typeof this.defaultConfig);
    }

    async getContract(): Promise<TypechainContractInstance<ContractFactory>> {
        const provider = await this.getProvider();
        return provider.getContract(this.contractFactory, this.contractAddress);
    }

    constructor(
        private readonly contractAddress: string,
        private readonly contractFactory: ContractFactory,
        config: EthersTypechainContractIndexerConfig,
    ) {
        if (!ethers.utils.isAddress(contractAddress)) {
            throw new Error("Invalid contract address.");
        }

        super(EthersTypechainContractProvider, config);
    }

    async index({
        startingBlock,
        endingBlock = this.latestBlock,
        previousTransaction,
    }: EthersTypechainContractIndexerIndexOptions): Promise<number> {
        let fromBlock = startingBlock;
        let toBlock = Math.min(startingBlock + this.config.blocksBatchSize, endingBlock);
        let reachedPreviousTransaction = !previousTransaction;

        while (fromBlock <= endingBlock) {
            this.logger.info(`Indexing from block ${fromBlock} to block ${toBlock}...`);

            let events: TypechainTypedEvent<any, any>[];
            try {
                // Get contract inside the loop because the internal provider can change between reconnects.
                this.logger.debug(`Getting contract ${this.contractAddress}...`);
                const contract = await this.getContract();
                // Timeout needed because the `queryFilter` method hangs when the provider is disconnected.
                this.logger.debug(`Getting events from contract ${this.contractAddress} and blocks ${fromBlock} to ${toBlock}...`);
                events = await timeoutPromise(contract.queryFilter({}, fromBlock, toBlock), this.config.getEventsTimeout);
            } catch (e) {
                this.logger.error(`Error while getting events from block ${fromBlock} to block ${toBlock}: ${e}`);
                this.logger.info(`Retrying to fetch events from block ${fromBlock} to block ${toBlock}...`);
                await new Promise((resolve) => setTimeout(resolve, this.config.getEventsRetryTimeout));
                continue;
            }

            this.logger.debug(`Handling events from contract ${this.contractAddress} and blocks ${fromBlock} to ${toBlock}...`);
            for (const event of events) {
                // If the previous transaction has been reached the following ones can be indexed. Otherwise, it still needs to be found.
                if (reachedPreviousTransaction) {
                    // Emit event
                    (this.emit as any)("Event", event);
                    if (event.event) (this.emit as any)(event.event, event);
                    // Save the last indexed transaction state
                    this.setPartialState({
                        transaction: event.transactionHash,
                        block: event.blockNumber,
                    });
                    // TODO: What happens if some handlers can treat the tx but others can't (Edge case)
                } else if (event.transactionHash === previousTransaction) {
                    reachedPreviousTransaction = true;
                }
            }

            this.setState({
                block: toBlock,
            });

            this.logger.info(`Indexed from block ${fromBlock} to block ${toBlock}...`);

            fromBlock = toBlock + 1;
            toBlock = Math.min(toBlock + this.config.blocksBatchSize, endingBlock);
        }

        return fromBlock;
    }
}
