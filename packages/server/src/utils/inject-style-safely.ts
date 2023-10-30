import { HTMLElement } from 'node-html-parser'

export default function injectStyleSafely(element: HTMLElement, root: HTMLElement) {
    let headElement = root.getElementsByTagName('head')[0]
    // append styleElement to headElement
    if (headElement) {
        headElement.appendChild(element)
    } else {
        // prepend headElement to htmlElement
        const htmlElement = root.getElementsByTagName('html')[0]
        if (htmlElement) {
            headElement = new HTMLElement('head', {})
            headElement.appendChild(element)
            // prepend headElement to htmlElement
            htmlElement.childNodes.unshift(headElement)
        } else {
            root.appendChild(element)
        }
    }
}