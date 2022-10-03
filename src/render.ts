import { MasterCSS as MasterCSSStyleSheet } from '.'
import './polyfills/css-escape'

export function render(classes: string[], MasterCSS: typeof MasterCSSStyleSheet = MasterCSSStyleSheet): string {
    if (!classes?.length) return
    const styleSheet = new MasterCSS()
    for (const eachClassName of classes) {
        if (!(eachClassName in styleSheet.countOfName)) {
            styleSheet.findAndInsert(eachClassName)
            styleSheet.countOfName[eachClassName] = 1
        }
    }
    return styleSheet.rules.map(eachStyle => eachStyle.text).join('')
}