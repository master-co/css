export default function unquote(value: string) {
    const trimmed = value.trim()
    const quote = trimmed[0]
    if ((quote === '"' || quote === '\'') && trimmed.endsWith(quote)) {
        return trimmed
            .slice(1, -1)
            .replace(/\\(["'\\])/g, '$1')
    }
    return trimmed
}
