import MasterCSS from '../css'
import '../polyfills/css-escape'
import renderFromHTML from './render-from-html'

export default function renderIntoHTML(html: string, css: MasterCSS = new MasterCSS({ observe: false })): string {
    if (!html) return
    return html
        .replace(/(<head>)/, `$1<style title="master">${renderFromHTML(html, css)}</style>`)
}