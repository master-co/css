export const cls = (strings: TemplateStringsArray, ...tokens: any[]) => {
    return strings
        .reduce((result, value, index) => result + value + (tokens[index] || ''), '')
        .replace(/(?:\n(?:\s*))+/g, ' ')
        .trim();
}