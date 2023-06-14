import { MasterCSS } from '../core'
import { Config } from '../config'
import generateFromHTML from './generate-from-html'

/**
 * Renders the page-required and sorted CSS text from HTML and injected it back into HTML
 * @param html 
 * @param config 
 * @returns html text
 */
export default function renderHTML(html: string, config?: Config): string {
    if (!html) return
    let replaced = false
    html = html.replace(
        /(<style id="master">).*?(<\/style>)/,
        (_, prefix, suffix) => {
            replaced = true
            return prefix + generateFromHTML(html, config) + suffix
        }
    )
    if (replaced) {
        return html
    }
    const styleText = `<style id="master">${generateFromHTML(html, config)}</style>`
    return html.replace(/<\/head>/, `${styleText}$&`)
}