export function splitSelectorList(selectorText: string) {
    const selectors: string[] = []
    let current = ''
    let depth = 0
    let quote = ''

    for (let index = 0; index < selectorText.length; index++) {
        const char = selectorText[index]
        if (quote) {
            current += char
            if (char === '\\') {
                current += selectorText[++index] || ''
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            current += char
            continue
        }
        if (char === '(' || char === '[') {
            depth++
            current += char
            continue
        }
        if (char === ')' || char === ']') {
            depth--
            current += char
            continue
        }
        if (char === ',' && depth === 0) {
            selectors.push(current.trim())
            current = ''
            continue
        }
        current += char
    }

    if (current.trim()) selectors.push(current.trim())
    return selectors
}

export function combineSelectorLists(parentSelectors: string[], childSelectors: string[]) {
    const selectors: string[] = []

    for (const child of childSelectors) {
        for (const parent of parentSelectors) {
            selectors.push(child.includes('&')
                ? child.replace(/&/g, parent)
                : `${parent} ${child}`
            )
        }
    }

    return selectors
}

export function combineStyleSelectors(parentSelector: string, childSelector: string) {
    return combineSelectorLists(
        splitSelectorList(parentSelector),
        splitSelectorList(childSelector)
    ).join(',')
}
