import { Provider } from "@ethersproject/providers";
import { Event } from "@ethersproject/contracts";
import { Signer } from "ethers";

export interface TypechainTypedEvent<TArgsArray extends Array<any> = any, TArgsObject = any> extends Event {
    args: TArgsArray & TArgsObject;
}

export type TypechainEventFilter = {
    address?: string;
    topics?: Array<string | Array<string>>;
};

export interface TypechainTypedEventFilter<_TEvent extends TypechainTypedEvent> extends TypechainEventFilter {}

export type TypechainContract = {
    queryFilter<TEvent extends TypechainTypedEvent>(
        event: TypechainTypedEventFilter<TEvent>,
        fromBlockOrBlockhash?: string | number | undefined,
        toBlock?: string | number | undefined,
    ): Promise<Array<TEvent>>;
    interface: {
        events: Record<string, any>;
    };
    filters: Record<string, (...args: any[]) => TypechainTypedEventFilter<TypechainTypedEvent>>;
};

export type TypechainContractFactory = {
    connect(address: string, signerOrProvider: Signer | Provider): TypechainContract;
};

export type TypechainContractFactoryConstructor = {
    new (...args: any[]): TypechainContractFactory;
};

export type TypechainContractInstance<CF extends TypechainContractFactory> = ReturnType<CF["connect"]>;

export type TypechainContractEvents<C extends TypechainContract> = {
    [K in keyof C["interface"]["events"] extends `${infer K}(${string})` ? K : never]: (
        event: ReturnType<C["filters"][K]> extends TypechainTypedEventFilter<infer T> ? T : never,
    ) => void;
};
