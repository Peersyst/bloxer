/* eslint-disable no-console */
const { execSync } = require("child_process");
const fse = require("fs-extra");
const path = require("path");
const { buildFlavourImplementationNames } = require("./utils/names");

function main() {
    try {
        const [flavour, impl] = process.argv.slice(2);

        if (!flavour) throw new Error("No flavour argument provided");
        if (!impl) throw new Error("No impl argument provided");

        const { implSignature, implIndexerName } = buildFlavourImplementationNames(flavour, impl);

        const rootPath = process.cwd();
        const buildRootPath = (file) => path.join(rootPath, file);
        const drillsPath = buildRootPath("drills");
        const buildDrillsPath = (file) => path.join(drillsPath, file);
        const drillPath = buildDrillsPath(implSignature);
        const buildDrillPath = (file) => path.join(drillPath, file);
        const flavourPath = buildRootPath(`packages/${flavour}`);
        const buildFlavourPath = (file) => path.join(flavourPath, file);
        const implPath = buildFlavourPath(`packages/${impl}`);
        const buildImplPath = (file) => path.join(implPath, file);

        const relativeDrillPath = path.relative(rootPath, drillPath);

        if (!fse.existsSync(flavourPath)) throw new Error(`${flavour} flavour does not exist`);
        else if (!fse.existsSync(implPath)) throw new Error(`${impl} implementation does not exist`);

        if (!fse.existsSync(drillPath)) {
            console.log(`Drill ${implSignature} does not exist. Creating it...`);

            // Create drill folder
            fse.mkdirSync(drillPath);

            // Create package.json
            const rawImplPackage = fse.readFileSync(buildImplPath("package.json"), "utf8");
            const implPackage = JSON.parse(rawImplPackage);
            const implName = implPackage.name;
            const drillPackage = {
                name: `${implSignature}-drill`,
                private: true,
                scripts: {
                    drill: "ts-node drill.ts",
                },
                dependencies: {
                    [implName]: `../../packages/${flavour}/packages/${impl}`,
                },
            };
            fse.writeFileSync(buildDrillPath("package.json"), JSON.stringify(drillPackage, null, 2), "utf8");

            // Create state folder
            fse.mkdirSync(buildDrillPath("state"));

            // Create drill.ts
            const drill = `import { ${implIndexerName} } from "${implName}";

async function drill() {
    const indexer = new ${implIndexerName}({
        wsUrl: "",
        stateFilePath: "state/.${implSignature}-indexer-state.json",
    });
    await indexer.run();
}

drill();
`;
            fse.writeFileSync(buildDrillPath("drill.ts"), drill, "utf8");

            // Prettify
            execSync(`npx prettier --write ${buildDrillPath("./")}**/*.*`);

            console.log(`🚨 Drill ${implSignature} created! Run this command again to execute it.`);
        } else if (!fse.existsSync(buildDrillPath("drill.ts"))) throw new Error(`Drill ${impl} does not have a ts file`);
        else {
            console.log(`🚨 Running drill ${implSignature}...`);
            execSync(`cd ${relativeDrillPath} && npm i`);
            execSync(`cd ${relativeDrillPath} && npm run drill`, { stdio: "inherit" });
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
