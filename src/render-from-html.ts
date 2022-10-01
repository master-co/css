import { StyleSheet as MasterCSSStyleSheet } from '.'
import './polyfills/css-escape'

export function renderFromHTML(html: string, StyleSheet: typeof MasterCSSStyleSheet = MasterCSSStyleSheet): string {
    if (!html) return
    const styleSheet = new StyleSheet()
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
    return styleSheet.styles.map(eachStyle => eachStyle.text).join('')
}