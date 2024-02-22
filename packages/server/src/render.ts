import { MasterCSS, Config } from '@master/css'
import parseHTML from './parse-html'
import { Element, Text, ChildNode } from 'domhandler'
import serialize from 'dom-serializer'

/**
 * Renders the page-required and sorted CSS text from HTML and injected it back into HTML
 * @param html
 * @param config
 */
export default function render(html: string, config?: Config): {
    html: string,
    css?: MasterCSS,
    classes: string[],
    nodes: ChildNode[],
    htmlElement: Element | null,
    headElement: Element | null,
    styleElement: Element | null
} {
    const context = parseHTML(html)
    const { classes, nodes, htmlElement } = context
    let { headElement, styleElement } = context
    if (!classes.length) return {
        html,
        classes,
        nodes,
        htmlElement,
        headElement,
        styleElement
    }
    const css = new MasterCSS(config)
    classes.forEach(eachClass => css.add(eachClass))
    if (styleElement) {
        styleElement.childNodes = [new Text(css.text)]
    } else {
        styleElement = new Element('style', { id: 'master' }, [new Text(css.text)])
        if (headElement) {
            headElement.childNodes.push(styleElement)
        } else {
            if (htmlElement) {
                headElement = new Element('head', {}, [styleElement])
                htmlElement.childNodes.unshift(headElement)
            } else {
                nodes.unshift(styleElement)
            }
        }
    }
    return {
        html: serialize(nodes, {
            decodeEntities: false,
            encodeEntities: false
        }),
        css,
        classes,
        nodes,
        htmlElement,
        headElement,
        styleElement
    }
}