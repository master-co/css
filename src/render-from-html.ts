import { MasterCSS } from '.'
import './polyfills/css-escape'

export function renderFromHTML(html: string, _MasterCSS: typeof MasterCSS = MasterCSS): string {
    if (!html) return
    const styleSheet = new _MasterCSS()
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
    return styleSheet.rules.map(eachRule => eachRule.text).join('')
}