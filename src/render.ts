import { MasterCSS } from './css'
import './polyfills/css-escape'

export function render(classes: string[], css: MasterCSS = new MasterCSS()): string {
    if (!classes?.length) return
    for (const eachClassName of classes) {
        if (!(eachClassName in css.countOfName)) {
            css.findAndInsert(eachClassName)
            css.countOfName[eachClassName] = 1
        }
    }
    return css.rules.map(eachRule => eachRule.text).join('')
}