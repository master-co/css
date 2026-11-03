export function parseToCssRules(text: string) {
    return text.match(/(.*?\{(?:[^{}]|(?:.*?\{(?:[^{}]|)*\}))*?\})/g);
}