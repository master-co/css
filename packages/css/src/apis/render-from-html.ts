import MasterCSS from '../css'
import '../polyfills/css-escape'

export default function renderFromHTML(html: string, css: MasterCSS = new MasterCSS({ observe: false })): string {
    if (!html) return
    const regexp = /\sclass="([^"]*)"/gm
    let results: string[]
    while ((results = regexp.exec(html))) {
        const classNames = results[1].replace(/\n/g, '').split(' ').filter(css => css)
        for (const eachClassName of classNames) {
            if (!(eachClassName in css.countOfClass)) {
                css.findAndInsert(eachClassName)
                css.countOfClass[eachClassName] = 1
            }
        }
    }
    return css.rules.map(eachRule => eachRule.natives.reduce((a, b) => a + b.text, '')).join('')
}