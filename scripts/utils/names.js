const { pascalCase } = require("./string");

function buildFlavourNames(flavour) {
    const flavourName = pascalCase(flavour);
    const flavourProviderName = `${flavourName}Provider`;
    const flavourIndexerName = `${flavourName}Indexer`;
    const flavourIndexerGenericsName = `${flavourIndexerName}Generics`;
    const flavourExtendedIndexerConfigName = `${flavourIndexerName}Config`;
    const flavourExtendedIndexOptionsName = `${flavourIndexerName}IndexOptions`;

    return {
        flavourName,
        flavourProviderName,
        flavourIndexerName,
        flavourIndexerGenericsName,
        flavourExtendedIndexerConfigName,
        flavourExtendedIndexOptionsName,
    };
}

function buildFlavourImplementationNames(flavour, impl) {
    const { flavourName, flavourIndexerName, flavourProviderName } = buildFlavourNames(flavour);

    const implName = `${flavourName}${pascalCase(impl)}`;
    const implIndexerName = `${implName}Indexer`;
    const implIndexerConfigName = `${implIndexerName}Config`;
    const implIndexOptionsName = `${implIndexerName}IndexOptions`;
    const implEventsName = `${implIndexerName}Events`;

    return {
        flavourName,
        flavourIndexerName,
        flavourProviderName,
        implSignature: `${flavour}-${impl}`,
        implName,
        implIndexerName,
        implIndexerConfigName,
        implIndexOptionsName,
        implEventsName,
    };
}

module.exports = {
    buildFlavourNames,
    buildFlavourImplementationNames,
};
