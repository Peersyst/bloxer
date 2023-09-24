import { TypechainContractEvents, TypechainContractFactory, TypechainContractInstance } from "./typechain.types";

export type EthersTypechainContractIndexerEvents<C extends TypechainContractFactory> = TypechainContractEvents<
    TypechainContractInstance<C>
>;
