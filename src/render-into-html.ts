import MasterCSS from './css'
import './polyfills/css-escape'
import { renderFromHTML } from './render-from-html'

export function renderIntoHTML(html: string, css: MasterCSS = new MasterCSS()): string {
    if (!html) return
    return html
        .replace(/(<head>)/, `$1<style title="master">${renderFromHTML(html, css)}</style>`)
}