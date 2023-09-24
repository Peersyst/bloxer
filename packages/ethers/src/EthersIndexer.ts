import { Indexer, ProviderConstructor } from "@bloxer/vanilla";
import { EthersProvider } from "./EthersProvider";
import { EthersIndexerGenerics } from "./types";

export abstract class EthersIndexer<Generics extends EthersIndexerGenerics> extends Indexer<{
    provider: Generics["provider"] extends undefined ? EthersProvider : Generics["provider"];
    events: Generics["events"];
    config: Generics["config"];
    state: Generics["state"];
    indexOptions: Generics["indexOptions"];
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "EthersIndexer",
            },
            stateFilePath: "./.ethers-indexer-state.json",
        } as typeof this.defaultConfig);
    }

    constructor(...args: [Provider: ProviderConstructor<Generics["provider"]>, config: Generics["config"]] | [config: Generics["config"]]) {
        if (args.length === 1) {
            super(EthersProvider, args[0]);
        } else {
            super(args[0], args[1]);
        }
    }
}
