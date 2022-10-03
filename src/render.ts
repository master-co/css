import { MasterCSS } from '.'
import './polyfills/css-escape'

export function render(classes: string[], _MasterCSS: typeof MasterCSS = MasterCSS): string {
    if (!classes?.length) return
    const styleSheet = new _MasterCSS()
    for (const eachClassName of classes) {
        if (!(eachClassName in styleSheet.countOfName)) {
            styleSheet.findAndInsert(eachClassName)
            styleSheet.countOfName[eachClassName] = 1
        }
    }
    return styleSheet.rules.map(eachRule => eachRule.text).join('')
}