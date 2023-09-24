import { EthersProvider } from "@bloxer/ethers";
import { TypechainContractFactory as GenericTypechainContractFactory, TypechainContractInstance } from "./typechain.types";

export class EthersTypechainContractProvider extends EthersProvider {
    async getContract<ContractFactory extends GenericTypechainContractFactory>(
        factory: ContractFactory,
        address: string,
    ): Promise<TypechainContractInstance<ContractFactory>> {
        const signer = await this.provider.getSigner();
        return factory.connect(address, signer) as TypechainContractInstance<ContractFactory>;
    }
}
