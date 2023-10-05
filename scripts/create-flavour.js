/* eslint-disable no-console */
const { execSync } = require("child_process");
const path = require("path");
const fse = require("fs-extra");
const { buildFlavourNames } = require("./utils/names");

// Main
function main() {
    try {
        const [flavour] = process.argv.slice(2);

        if (!flavour) throw new Error("No flavour argument provided");

        const {
            flavourProviderName,
            flavourIndexerName,
            flavourIndexerGenericsName,
            flavourExtendedIndexerConfigName,
            flavourExtendedIndexerStateName,
            flavourExtendedIndexOptionsName,
        } = buildFlavourNames(flavour);

        const rootPath = process.cwd();
        const buildRootPath = (file) => path.join(rootPath, file);
        const flavourPackagesPath = buildRootPath("packages");
        const buildFlavourPackagePath = (file) => path.join(flavourPackagesPath, file);
        const flavourPath = buildFlavourPackagePath(flavour);
        const buildFlavourPath = (file) => path.join(flavourPath, file);
        const vanillaPath = path.join(flavourPackagesPath, "vanilla");
        const flavourSrcPath = buildFlavourPath("src");
        const buildFlavourSrcPath = (file) => path.join(flavourSrcPath, file);

        if (fse.existsSync(flavourPath)) throw new Error(`${flavour} flavour already exists`);
        // Create flavour folder
        fse.mkdirSync(flavourPath);

        // Create flavour README.md
        const flavourReadme = `# @bloxer/${flavour}

Lightweight and simple ${flavour} indexer framework based on custom events.
`;

        fse.writeFileSync(buildFlavourPath("README.md"), flavourReadme, "utf8");

        // Create flavour package.json
        const vanillaPackageString = fse.readFileSync(path.resolve(vanillaPath, "package.json"), "utf8");
        const vanillaPackage = JSON.parse(vanillaPackageString);
        const flavourPackage = {
            name: `@bloxer/${flavour}`,
            version: "0.0.0",
            description: `Lightweight and simple ${flavour} indexer framework based on custom events.`,
            private: false,
            main: "src/index.ts",
            scripts: {
                build: "node ../../scripts/build.js",
                clean: "rm -rf dist",
            },
            author: "Peersyst",
            license: "ISC",
            dependencies: {
                [vanillaPackage.name]: `^${vanillaPackage.version}`,
            },
            devDependencies: {},
            sideEffects: false,
            publishConfig: {
                access: "public",
            },
        };
        fse.writeFileSync(buildFlavourPath("package.json"), JSON.stringify(flavourPackage, null, 2), "utf8");

        // Create tsconfig.json
        const tsconfig = {
            extends: "../../tsconfig.json",
            compilerOptions: {
                outDir: "./dist/lib",
            },
            include: ["src/**/*"],
        };
        fse.writeFileSync(buildFlavourPath("tsconfig.json"), JSON.stringify(tsconfig, null, 2), "utf8");

        // Create CHANGELOG.md
        const changelog = `# Versions

## 0.0.0
`;
        fse.writeFileSync(buildFlavourPath("CHANGELOG.md"), changelog, "utf8");

        // Add LICENSE
        fse.copyFileSync(buildRootPath("LICENSE"), buildFlavourPath("LICENSE"));

        // Create src folder
        fse.mkdirSync(buildFlavourPath("src"));

        // Create FlavourProvider class
        const flavourProvider = `import { Provider } from "${vanillaPackage.name}";

type Request = any;

export class ${flavourProviderName} extends Provider<Request> {
    constructor(wsUrl: string) {
        super(wsUrl);
    }

    connect(): void {}

    waitConnection(): Promise<void> {}

    setListeners(): void {}

    subscribeToLatestBlock(): Promise<void> {}

    unsubscribeFromLatestBlock(): Promise<void> {}

    disconnect(): Promise<void> {}

    isConnected(): boolean {}

    request: Request = () => ({});
}
`;
        fse.writeFileSync(buildFlavourSrcPath(`${flavourProviderName}.ts`), flavourProvider, "utf8");

        // Create types
        const flavourTypes = `import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "${vanillaPackage.name}";
import { ${flavourProviderName} } from "./${flavourProviderName}";

export type ${flavourExtendedIndexerConfigName} = ExtendedIndexerConfig<{}>;

export type ${flavourExtendedIndexerStateName} = ExtendedIndexerState<{}>;

export type ${flavourExtendedIndexOptionsName} = ExtendedIndexOptions<{}>;

export type ${flavourIndexerGenericsName} = {
    provider?: ${flavourProviderName};
    events: Record<string, (...args: any[]) => any>;
    config?: ${flavourExtendedIndexerConfigName};
    state?: ${flavourExtendedIndexerStateName};
    indexOptions?: ${flavourExtendedIndexOptionsName};
};
`;
        fse.writeFileSync(buildFlavourSrcPath(`types.ts`), flavourTypes, "utf8");

        // Create FlavourIndexer class
        const flavourIndexer = `import { Indexer, ProviderConstructor } from "${vanillaPackage.name}";
import { ${flavourProviderName} } from "./${flavourProviderName}";
import { ${flavourIndexerGenericsName} } from "./types";

export abstract class ${flavourIndexerName}<Generics extends ${flavourIndexerGenericsName}> extends Indexer<{
    provider: Generics["provider"] extends undefined ? ${flavourProviderName} : Generics["provider"];
    events: Generics["events"];
    config: Generics["config"];
    state: Generics["state"];
    indexOptions: Generics["indexOptions"];
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "${flavourIndexerName}",
            },
            stateFilePath: "./.${flavour}-indexer-state.json",
        } as typeof this.defaultConfig);
    }

    constructor(...args: [Provider: ProviderConstructor<Generics["provider"]>, config: Generics["config"]] | [config: Generics["config"]]) {
        if (args.length === 1) {
            super(${flavourProviderName}, args[0]);
        } else {
            super(args[0], args[1]);
        }
    }
}
`;
        fse.writeFileSync(buildFlavourSrcPath(`${flavourIndexerName}.ts`), flavourIndexer, "utf8");

        // Create index
        const flavourIndex = `export * from "./${flavourProviderName}";
export * from "./${flavourIndexerName}";
export * from "./types";
`;
        fse.writeFileSync(buildFlavourSrcPath(`index.ts`), flavourIndex, "utf8");

        // Prettify
        execSync(`npx prettier --write ${buildFlavourSrcPath("./")}**/*.*`);

        console.log(`🍧 Flavour ${flavour} created successfully`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
