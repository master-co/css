import { MasterCSS as MasterCSSStyleSheet } from '.'
import './polyfills/css-escape'

export function renderFromHTML(html: string, MasterCSS: typeof MasterCSSStyleSheet = MasterCSSStyleSheet): string {
    if (!html) return
    const styleSheet = new MasterCSS()
    const regexp = /\sclass="([^"]*)"/gm
    let results: string[]
    while (results = regexp.exec(html)) {
        const classNames = results[1].replace(/\n/g, '').split(' ').filter(css => css)
        for (const eachClassName of classNames) {
            if (!(eachClassName in styleSheet.countOfName)) {
                styleSheet.findAndInsert(eachClassName)
                styleSheet.countOfName[eachClassName] = 1
            }
        }
    }
    return styleSheet.rules.map(eachStyle => eachStyle.text).join('')
}