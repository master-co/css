import type { Config } from '../config'
import { renderFromHTML } from './render-from-html'

export function renderIntoHTML(html: string, config?: Config): string {
    if (!html) return

    const styleText = `<style id="master">${renderFromHTML(html, config)}</style>`
    const precedence = config?.precedence ?? 'highest'
    switch (precedence) {
        case 'highest':
            return html.replace(/<\/body>/, `${styleText}$&`)
        case 'higher':
            return html.replace(/<\/head>/, `${styleText}$&`)
        default:
            return html.replace(/(<link[^>]*?rel="styleSheet".*?>|<style.*?>|<\/head>)/, `${styleText}$1`)
    }
}