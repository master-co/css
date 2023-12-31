import { DomHandler, Parser } from 'htmlparser2'
import type { ChildNode, Element } from 'domhandler'
import decodeHTML from './decode-html'

/**
 * @param html
 * @returns {classes from html, root element}
 */
export default function parseHTML(html: string): {
    classes: string[],
    nodes: ChildNode[],
    htmlElement: Element | null,
    headElement: Element | null,
    styleElement: Element | null
} {
    const classes: string[] = []
    let htmlElement: Element | null = null
    let headElement: Element | null = null
    let styleElement: Element | null = null

    const handler = new DomHandler(undefined, {}, (element) => {
        if (element.type === 'tag') {
            switch (element.name) {
                case 'html':
                    htmlElement = element
                    break
                case 'head':
                    headElement = element
                    break
                default:
                    break
            }
        } else if (element.type === 'style') {
            if (element.attribs.id === 'master')
                styleElement = element
        }

        if (element.attribs.class) {
            element.attribs.class
                .split(' ')
                .forEach((className) => {
                    className = decodeHTML(className)
                    if (!classes.includes(className))
                        classes.push(className)
                })
        }
    })

    new Parser(handler, {
        decodeEntities: false
    }).end(html)

    return {
        classes,
        nodes: handler.root.childNodes,
        htmlElement,
        headElement,
        styleElement
    }
}
