import { MasterCSS } from '../core'
import type { Config } from '../config'
import { extractClassesFromHTML } from './extract-classes-from-html'

export function renderFromHTML(html: string, config?: Config): string {
    if (!html) return
    const classes = extractClassesFromHTML(html)
    if (!classes.length) return
    const css = new MasterCSS({ ...config, observe: false })
    for (const eachClassName of classes) {
        if (!(eachClassName in css.countBy)) {
            if (css.insert(eachClassName))
                css.countBy[eachClassName] = 1
        }
    }
    return css.text
}