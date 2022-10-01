import { StyleSheet as MasterCSSStyleSheet } from '.'
import './polyfills/css-escape'

export function render(classes: string[], StyleSheet: typeof MasterCSSStyleSheet = MasterCSSStyleSheet): string {
    if (!classes?.length) return
    const styleSheet = new StyleSheet()
    for (const eachClassName of classes) {
        if (!(eachClassName in styleSheet.countOfName)) {
            styleSheet.findAndInsert(eachClassName)
            styleSheet.countOfName[eachClassName] = 1
        }
    }
    return styleSheet.styles.map(eachStyle => eachStyle.text).join('')
}