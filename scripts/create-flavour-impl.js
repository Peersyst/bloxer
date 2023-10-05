/* eslint-disable no-console */
const { execSync } = require("child_process");
const path = require("path");
const fse = require("fs-extra");
const { buildFlavourImplementationNames } = require("./utils/names");

// Main
function main() {
    try {
        const [flavour, impl] = process.argv.slice(2);

        if (!flavour) throw new Error("No flavour argument provided");
        if (!impl) throw new Error("No impl argument provided");

        const {
            flavourIndexerName,
            flavourProviderName,
            implSignature,
            implIndexerName,
            implIndexerConfigName,
            implIndexerStateName,
            implIndexOptionsName,
            implEventsName,
        } = buildFlavourImplementationNames(flavour, impl);

        const rootPath = process.cwd();
        const buildRootPath = (file) => path.join(rootPath, file);
        const flavourPackagesPath = buildRootPath("packages");
        const buildFlavourPackagePath = (file) => path.join(flavourPackagesPath, file);
        const vanillaPath = path.join(flavourPackagesPath, "vanilla");
        const flavourPath = buildFlavourPackagePath(flavour);
        const buildFlavourPath = (file) => path.join(flavourPath, file);
        const implsPackagesPath = buildFlavourPath("packages");
        const buildImplPackagePath = (file) => path.join(implsPackagesPath, file);
        const implPath = buildImplPackagePath(impl);
        const buildImplPath = (file) => path.join(implPath, file);
        const implSrcPath = buildImplPath("src");
        const buildImplSrcPath = (file) => path.join(implSrcPath, file);

        // Create impl folder if it does not exist
        if (!fse.existsSync(implsPackagesPath)) fse.mkdirSync(implsPackagesPath);
        else if (fse.existsSync(implPath)) throw new Error(`${impl} implementation already exists`);
        fse.mkdirSync(implPath);

        // Create flavour README.md
        const implReadme = `# @bloxer/${implSignature}

Lightweight and simple ${flavour} ${impl} indexer based on custom events.
`;

        fse.writeFileSync(buildImplPath("./README.md"), implReadme, "utf8");

        // Create impl package.json
        const vanillaPackageString = fse.readFileSync(path.resolve(vanillaPath, "package.json"), "utf8");
        const vanillaPackage = JSON.parse(vanillaPackageString);
        const flavourPackageString = fse.readFileSync(path.resolve(flavourPath, "package.json"), "utf8");
        const flavourPackage = JSON.parse(flavourPackageString);
        const implPackage = {
            name: `@bloxer/${implSignature}`,
            version: "0.0.0",
            description: `Lightweight and simple ${flavour} ${impl} indexer based on custom events.`,
            private: false,
            main: "src/index.ts",
            scripts: {
                build: "node ../../../../scripts/build.js",
                clean: "rm -rf dist",
            },
            author: "Peersyst",
            license: "ISC",
            dependencies: {
                [vanillaPackage.name]: `^${vanillaPackage.version}`,
                [flavourPackage.name]: `^${flavourPackage.version}`,
            },
            devDependencies: {},
            sideEffects: false,
            publishConfig: {
                access: "public",
            },
        };
        fse.writeFileSync(buildImplPath("package.json"), JSON.stringify(implPackage, null, 2), "utf8");

        // Create tsconfig.json
        const tsconfig = {
            extends: "../../tsconfig.json",
            compilerOptions: {
                outDir: "./dist/lib",
            },
            include: ["src/**/*"],
        };
        fse.writeFileSync(buildImplPath("tsconfig.json"), JSON.stringify(tsconfig, null, 2), "utf8");

        // Create CHANGELOG.md
        const changelog = `# Versions

## 0.0.0
`;
        fse.writeFileSync(buildImplPath("CHANGELOG.md"), changelog, "utf8");

        // Add LICENSE
        fse.copyFileSync(buildFlavourPath("LICENSE"), buildImplPath("LICENSE"));

        // Create src folder
        fse.mkdirSync(buildImplPath("src"));

        // Create types
        const implTypes = `import { ExtendedIndexerState, ExtendedIndexOptions, ExtendedIndexerConfig } from "${vanillaPackage.name}"
        
export type ${implIndexerConfigName} = ExtendedIndexerConfig<{}>;

export type ${implIndexerStateName} = ExtendedIndexerState<{}>;

export type ${implIndexOptionsName} = ExtendedIndexOptions<{}>;
`;
        fse.writeFileSync(buildImplSrcPath(`types.ts`), implTypes, "utf8");

        // Create events
        const implEvents = `export type ${implEventsName} = {};
`;
        fse.writeFileSync(buildImplSrcPath(`events.ts`), implEvents, "utf8");

        // Create FlavourImplIndexer class
        const implIndexer = `import { ${flavourIndexerName}, ${flavourProviderName} } from "${flavourPackage.name}";
import { ${implEventsName} } from "./events";
import { ${implIndexerConfigName}, ${implIndexerStateName}, ${implIndexOptionsName} } from "./types";

export class ${implIndexerName} extends ${flavourIndexerName}<{
    provider: ${flavourProviderName};
    events: ${implEventsName};
    config: ${implIndexerConfigName};
    state: ${implIndexerStateName};
    indexOptions: ${implIndexOptionsName};
}> {
    protected overrideDefaultConfig(defaultConfig: typeof this.defaultConfig): void {
        super.overrideDefaultConfig(defaultConfig);

        this.mergeDefaultConfig({
            logger: {
                name: "${implIndexerName}",
            },
            stateFilePath: "./.${implSignature}-indexer-state.json",
        } as typeof this.defaultConfig);
    }

    constructor(config: ${implIndexerConfigName}) {
        super(config);
    }

    async index({ startingBlock, endingBlock, previousTransaction }: ${implIndexOptionsName}): Promise<number> {}
}
`;
        fse.writeFileSync(buildImplSrcPath(`${implIndexerName}.ts`), implIndexer, "utf8");

        // Create index
        const implIndex = `export * from "./${implIndexerName}";
export * from "./types";
export * from "./events";
`;
        fse.writeFileSync(buildImplSrcPath(`index.ts`), implIndex, "utf8");

        // Prettify
        execSync(`npx prettier --write ${buildImplSrcPath("./")}**/*.*`);

        console.log(`🍨 Flavour implementation ${implSignature} created successfully`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
