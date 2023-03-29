import { MasterCSS } from '../css'
import type { Config } from '../config'

const decodeRegExp = /&(amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g
const decodeSymbol = {
    'amp': '&',
    '#38': '&',
    'lt': '<',
    '#60': '<',
    'gt': '>',
    '#62': '>',
    'apos': '\'',
    '#39': '\'',
    'quot': '"',
    '#34': '"'
}

export function renderFromHTML(html: string, config?: Config): string {
    if (!html) return
    const css = new MasterCSS({ ...config, observe: false })
    const regexp = /\sclass="([^"]*)"/gm
    let results: string[]
    while ((results = regexp.exec(html))) {
        const classNames = results[1]
            .replace(/\n/g, '')
            .split(' ')
            .filter(className => className)
            .map(className => className.replace(decodeRegExp, (_, key) => decodeSymbol[key]))
        for (const eachClassName of classNames) {
            if (!(eachClassName in css.countBy)) {
                css.insert(eachClassName)
                css.countBy[eachClassName] = 1
            }
        }
    }
    return css.text
}