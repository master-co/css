import { MasterCSS, renderFromHTML } from '.'
import './polyfills/css-escape'

export function renderIntoHTML(html: string, css: MasterCSS = new MasterCSS()): string {
    if (!html) return;
    return html
        .replace(/(<head>)/, `$1<style title="master">${renderFromHTML(html, css)}</style>`)
}