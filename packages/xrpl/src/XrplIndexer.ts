import { Indexer, ProviderConstructor } from "@bloxer/vanilla";
import { XrplProvider } from "./XrplProvider";
import { XrplIndexerGenerics } from "./types";

export abstract class XrplIndexer<Generics extends XrplIndexerGenerics> extends Indexer<{
    provider: Generics["provider"] extends undefined ? XrplProvider : Generics["provider"];
    events: Generics["events"];
    config: Generics["config"];
    state: Generics["state"];
    indexOptions: Generics["indexOptions"];
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "XrplIndexer",
            },
            stateFilePath: "./.xrpl-indexer-state.json",
        } as typeof this.defaultConfig);
    }

    constructor(...args: [Provider: ProviderConstructor<Generics["provider"]>, config: Generics["config"]] | [config: Generics["config"]]) {
        if (args.length === 1) {
            super(XrplProvider, args[0]);
        } else {
            super(args[0], args[1]);
        }
    }
}
