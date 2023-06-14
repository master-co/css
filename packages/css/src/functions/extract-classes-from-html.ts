/**
 * @param html
 * @returns classes from html
 */
export default function extractClassesFromHTML(html: string): string[] {
    if (!html) return
    const decodeRegExp = /&(amp|#38|lt|#60|gt|#62|apos|#39|#x27|quot|#34);/g
    const decodeSymbol = {
        'amp': '&',
        '#38': '&',
        'lt': '<',
        '#60': '<',
        'gt': '>',
        '#62': '>',
        'apos': '\'',
        '#39': '\'',
        '#x27': '\'',
        'quot': '"',
        '#34': '"'
    }
    return html.split(/\sclass="([^"]*)"/gm)
        .filter((each, i) => i % 2 === 1)
        .map((eachClassValue) => eachClassValue.split(' '))
        .flat()
        .map(className => className.replace(decodeRegExp, (_, key) => decodeSymbol[key]))
}