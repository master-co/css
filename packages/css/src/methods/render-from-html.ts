import { MasterCSS } from '../css'
import type { Config } from '..'
import '../polyfills/css-escape'

export function renderFromHTML(html: string, config?: Config): string {
    if (!html) return
    const css = new MasterCSS({ ...config, observe: false })
    const regexp = /\sclass="([^"]*)"/gm
    let results: string[]
    while ((results = regexp.exec(html))) {
        const classNames = results[1].replace(/\n/g, '').split(' ').filter(css => css)
        for (const eachClassName of classNames) {
            if (!(eachClassName in css.countOfClass)) {
                css.insert(eachClassName)
                css.countOfClass[eachClassName] = 1
            }
        }
    }
    return css.text
}