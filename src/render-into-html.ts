import { MasterCSS, renderFromHTML } from '.'
import './polyfills/css-escape'

export function renderIntoHTML(html: string,  _MasterCSS: typeof MasterCSS = MasterCSS): string {
    if (!html) return;
    return html
        .replace(/(<head>)/, `$1<style id="master-css">${renderFromHTML(html, _MasterCSS)}</style>`)
}