import { Parser } from 'htmlparser2'
import { addClassString } from './class-string'
import { extractOxcClasses } from './oxc'
import type { SourceAdapter } from './types'

export const HTML_SOURCE_EXT = /\.html?(?:\?|$)/

export function extractHTMLClasses(source: string, content: string): string[] {
    const classes = new Set<string>()
    const classStringCache = new Map<string, string[]>()
    let scriptDepth = 0
    let scriptContent = ''

    const flushScript = () => {
        if (!scriptContent) return
        for (const className of extractOxcClasses(`${source}.js`, scriptContent)) {
            if (className) classes.add(className)
        }
        scriptContent = ''
    }

    const parser = new Parser({
        onopentag(name, attributes) {
            if (name === 'script') {
                scriptDepth++
                return
            }
            addClassString(classes, attributes.class, classStringCache)
        },
        ontext(text) {
            if (scriptDepth > 0) {
                scriptContent += text
            }
        },
        onclosetag(name) {
            if (name !== 'script') return
            scriptDepth = Math.max(0, scriptDepth - 1)
            if (scriptDepth === 0) flushScript()
        },
        onend() {
            flushScript()
        }
    }, {
        decodeEntities: false
    })

    parser.end(content)
    return [...classes]
}

export function htmlAdapter(): SourceAdapter {
    return {
        name: 'html',
        test: HTML_SOURCE_EXT,
        async extract({ source, content }) {
            return extractHTMLClasses(source, content)
        }
    }
}
