import { EthersProvider } from "@bloxer/ethers";
import { TypechainContractFactory as GenericTypechainContractFactory, TypechainContractInstance } from "./typechain.types";

export class EthersTypechainContractProvider extends EthersProvider {
    getContract<ContractFactory extends GenericTypechainContractFactory>(
        factory: ContractFactory,
        address: string,
    ): TypechainContractInstance<ContractFactory> {
        return factory.connect(address, this.provider) as TypechainContractInstance<ContractFactory>;
    }
}
