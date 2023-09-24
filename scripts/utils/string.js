function upperFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const wordPattern = new RegExp(["[A-Z][a-z]+", "[A-Z]+(?=[A-Z][a-z])", "[A-Z]+", "[a-z]+", "[0-9]+"].join("|"), "g");
function words(string, pattern) {
    if (pattern === undefined) {
        return string.match(wordPattern) || [];
    }
    return string.match(pattern) || [];
}

function camelCase(string) {
    return words(string)
        .map((word, index) => (index === 0 ? word.toLowerCase() : upperFirst(word.toLowerCase())))
        .join("");
}

function pascalCase(string) {
    return words(string)
        .map((word) => upperFirst(word.toLowerCase()))
        .join("");
}

module.exports = {
    upperFirst,
    words,
    camelCase,
    pascalCase,
};
