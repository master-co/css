import type { Config } from '../config'
import { renderFromHTML } from './render-from-html'

export function renderIntoHTML(html: string, config?: Config): string {
    if (!html) return
    const styleText = `<style id="master">${renderFromHTML(html, config)}</style>`
    return html.replace(/<\/head>/, `${styleText}$&`)
}