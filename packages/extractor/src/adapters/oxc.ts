import { parseSync, visitorKeys } from 'oxc-parser'
import extractLatentClasses from '../functions/extract-latent-classes'
import type { SourceAdapter } from './types'

export const OXC_SOURCE_EXT = /\.(?:(?:[cm]?[jt]s)|(?:[jt]sx))(?:\?|$)/

interface OxcNode {
    type: string
    value?: unknown
    expressions?: unknown[]
    quasis?: {
        value?: {
            cooked?: string | null
            raw?: string | null
        }
    }[]
    [key: string]: unknown
}

function normalizeSource(source: string) {
    return source.split('?')[0] || source
}

function addClassString(classes: Set<string>, value: string | undefined | null) {
    if (!value) return
    for (const className of extractLatentClasses(value)) {
        if (className) classes.add(className)
    }
}

function isOxcNode(value: unknown): value is OxcNode {
    return !!value && typeof value === 'object' && typeof (value as { type?: unknown }).type === 'string'
}

function getTemplateLiteralValue(node: OxcNode) {
    if (node.expressions?.length) return
    const quasis = node.quasis || []
    if (quasis.length !== 1) return
    return quasis[0]?.value?.cooked ?? quasis[0]?.value?.raw
}

export function extractOxcClasses(source: string, content: string): string[] {
    let parseResult: ReturnType<typeof parseSync>
    try {
        parseResult = parseSync(normalizeSource(source), content, {
            range: false,
            sourceType: 'unambiguous'
        })
    } catch {
        return extractLatentClasses(content)
    }
    if (parseResult.errors.length) {
        return extractLatentClasses(content)
    }

    const classes = new Set<string>()
    const visit = (node: unknown) => {
        if (!isOxcNode(node)) return

        if (node.type === 'Literal' && typeof node.value === 'string') {
            addClassString(classes, node.value)
        } else if (node.type === 'TemplateLiteral') {
            addClassString(classes, getTemplateLiteralValue(node))
        }

        const keys = visitorKeys[node.type] || []
        for (const key of keys) {
            const value = node[key]
            if (Array.isArray(value)) {
                for (const child of value) visit(child)
            } else {
                visit(value)
            }
        }
    }

    visit(parseResult.program)
    return [...classes]
}

export function oxcAdapter(): SourceAdapter {
    return {
        name: 'oxc',
        test: OXC_SOURCE_EXT,
        extract({ source, content }) {
            return extractOxcClasses(source, content)
        }
    }
}
