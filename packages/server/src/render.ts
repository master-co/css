import MasterCSS, { Config } from '@master/css'
import { HTMLElement } from 'node-html-parser'
import injectStyleSafely from './utils/inject-style-safely'
import parseHTML from './parse-html'

/**
 * Renders the page-required and sorted CSS text from HTML and injected it back into HTML
 * @param html
 * @param config
 */
export default function render(html: string, config?: Config): { html: string, root: HTMLElement, css?: MasterCSS, classes?: string[] } {
    if (!html) return
    const { classes, root } = parseHTML(html)
    if (!classes.length) return { html, root, classes }
    const css = new MasterCSS(config)
    classes.forEach(eachClass => css.add(eachClass))
    let styleElement = root.getElementById('master')
    if (styleElement) {
        styleElement.textContent = css.text
    } else {
        styleElement = new HTMLElement('style', { id: 'master' })
        styleElement.textContent = css.text
        injectStyleSafely(styleElement, root)
    }
    return { html: root.innerHTML, css, root, classes }
}