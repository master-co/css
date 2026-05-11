import { extractLatentClasses, extractOxcClasses, type SourceAdapter, type SourceAdapterInput } from '@master/css-extractor'
import { parse } from 'svelte/compiler'

interface SvelteRange {
    start?: number
    end?: number
}

interface SvelteAttributeValue extends SvelteRange {
    type?: string
    data?: string
    raw?: string
}

interface SvelteAttribute {
    type?: string
    name?: string
    value?: SvelteAttributeValue[]
    expression?: SvelteRange
}

interface SvelteMarkupNode {
    attributes?: SvelteAttribute[]
    children?: SvelteMarkupNode[]
}

function addClassString(classes: Set<string>, value: string | undefined) {
    if (!value) return
    for (const className of extractLatentClasses(value)) {
        if (className) classes.add(className)
    }
}

function addOxc(classes: Set<string>, source: string, content: string) {
    for (const className of extractOxcClasses(source, content)) {
        if (className) classes.add(className)
    }
}

function visitMarkup(node: SvelteMarkupNode | undefined, source: string, content: string, classes: Set<string>) {
    if (!node || typeof node !== 'object') return

    if (Array.isArray(node.attributes)) {
        for (const attribute of node.attributes) {
            if (attribute.type === 'Class') {
                addClassString(classes, attribute.name)
                if (attribute.expression?.start != null && attribute.expression?.end != null) {
                    addOxc(classes, `${source}.js`, content.slice(attribute.expression.start, attribute.expression.end))
                }
                continue
            }
            if (attribute.type !== 'Attribute' || attribute.name !== 'class') continue
            for (const value of attribute.value || []) {
                if (value.type === 'Text') {
                    addClassString(classes, value.data ?? value.raw)
                } else if (value.start != null && value.end != null) {
                    addOxc(classes, `${source}.js`, content.slice(value.start, value.end))
                }
            }
        }
    }

    for (const child of node.children || []) {
        visitMarkup(child, source, content, classes)
    }
}

export function extractSvelteClasses(source: string, content: string): string[] {
    const ast = parse(content)
    const classes = new Set<string>()

    if (ast.module?.content) {
        addOxc(classes, `${source}.js`, content.slice(ast.module.content.start, ast.module.content.end))
    }
    if (ast.instance?.content) {
        addOxc(classes, `${source}.js`, content.slice(ast.instance.content.start, ast.instance.content.end))
    }
    visitMarkup(ast.html as SvelteMarkupNode, source, content, classes)

    return [...classes]
}

export function svelteAdapter(): SourceAdapter {
    return {
        name: 'svelte',
        test: /\.svelte(?:\?|$)/,
        extract({ source, content }: SourceAdapterInput) {
            return extractSvelteClasses(source, content)
        }
    }
}
