import { MasterCSS } from '.'
import './polyfills/css-escape'

export function renderFromHTML(html: string, css: MasterCSS = new MasterCSS()): string {
    if (!html) return
    const regexp = /\sclass="([^"]*)"/gm
    let results: string[]
    while (results = regexp.exec(html)) {
        const classNames = results[1].replace(/\n/g, '').split(' ').filter(css => css)
        for (const eachClassName of classNames) {
            if (!(eachClassName in css.countOfName)) {
                css.findAndInsert(eachClassName)
                css.countOfName[eachClassName] = 1
            }
        }
    }
    return css.rules.map(eachRule => eachRule.text).join('')
}