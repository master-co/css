import { parse, type HTMLElement } from 'node-html-parser'

/**
 * @param html
 * @returns {classes from html, root element}
 */
export default function parseHTML(html: string): { classes: string[], root: HTMLElement } {
    if (!html) return
    const classes = []
    const root = parse(html, { comment: true })
    root.querySelectorAll('[class]').forEach(element => {
        const className = element.getAttribute('class')
        if (className) {
            classes.push(...className.split(' '))
        }
    })
    return { classes, root }
}

