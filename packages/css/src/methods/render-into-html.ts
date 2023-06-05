import type { Config } from '../config'
import { renderFromHTML } from './render-from-html'

export function renderIntoHTML(html: string, config?: Config): string {
    if (!html) return
    let replaced = false
    html = html.replace(
        /(<style id="master">).*?(<\/style>)/,
        (_, prefix, suffix) => {
            replaced = true
            return prefix + renderFromHTML(html, config) + suffix
        }
    )
    if (replaced) {
        return html
    }
    const styleText = `<style id="master">${renderFromHTML(html, config)}</style>`
    return html.replace(/<\/head>/, `${styleText}$&`)
}