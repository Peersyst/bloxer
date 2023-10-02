import { EthersIndexer } from "@bloxer/ethers";
import { EthersTypechainContractIndexerEvents } from "./events";
import {
    EthersTypechainContractIndexerConfig,
    EthersTypechainContractIndexerState,
    EthersTypechainContractIndexerIndexOptions,
} from "./types";
import { EthersTypechainContractProvider } from "./EthersTypechainContractProvider";
import { TypechainContractFactory as GenericTypechainContractFactory, TypechainContractInstance } from "./typechain.types";
import { ethers } from "ethers";

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
        } as typeof this.defaultConfig);
    }

    private _contract: TypechainContractInstance<ContractFactory>;
    async getContract(): Promise<TypechainContractInstance<ContractFactory>> {
        if (!this._contract) {
            const provider = await this.getProvider();
            this._contract = await provider.getContract(this.contractFactory, this.contractAddress);
        }
        return this._contract;
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

        const contract = await this.getContract();

        while (fromBlock <= endingBlock) {
            const events = await contract.queryFilter({}, fromBlock, toBlock);

            this.logger.info(`Indexing from block ${fromBlock} to block ${toBlock}...`);

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
