import assert from 'node:assert/strict'
import { test } from 'node:test'
import css from '../common/preset-css'
import { generateSyntaxTrDeclarations } from './syntax-tr-declarations'
import { createSyntaxTrPlaceholderContext, type SyntaxTrHastNode } from './syntax-tr-placeholders'

test('proxies size with a px value and restores the placeholder in generated declarations', () => {
    const placeholders = createSyntaxTrPlaceholderContext()
    const proxy = placeholders.proxy('w:`size`')
    assert.equal(proxy, 'w:100000000px')

    const declarations = generateDeclarations(proxy)
    assert.equal(declarations.width, '100000000px')

    const restored = restoreText(placeholders, [convertDeclarationsToCSS(declarations)])
    assert.match(restored, /width: <size>;/)
    assert.doesNotMatch(restored, /100000000px/)
})

test('proxies length without a unit and restores length and color placeholders', () => {
    const placeholders = createSyntaxTrPlaceholderContext()
    const proxy = placeholders.proxy('text-stroke:`length`|`color`')
    assert.equal(proxy, 'text-stroke:123456789|#12345678')

    const declarations = generateDeclarations(proxy)
    assert.equal(declarations['-webkit-text-stroke'], '123456789 #12345678')

    const restored = restoreText(placeholders, [convertDeclarationsToCSS(declarations)])
    assert.match(restored, /-webkit-text-stroke: <length> <color>;/)
    assert.doesNotMatch(restored, /123456789|#12345678/)
})

test('proxies integer without a unit and restores the placeholder in generated declarations', () => {
    const placeholders = createSyntaxTrPlaceholderContext()
    const proxy = placeholders.proxy('grid-cols:`integer`')
    assert.equal(proxy, 'grid-cols:987654321')

    const declarations = generateDeclarations(proxy)
    assert.equal(declarations.display, 'grid')
    assert.equal(declarations['grid-template-columns'], 'repeat(987654321, minmax(0, 1fr))')

    const restored = restoreText(placeholders, [convertDeclarationsToCSS(declarations)])
    assert.match(restored, /grid-template-columns: repeat\(<integer>, minmax\(0, 1fr\)\);/)
    assert.doesNotMatch(restored, /987654321/)
})

test('restores generic placeholders split across text nodes', () => {
    const placeholders = createSyntaxTrPlaceholderContext()
    const proxy = placeholders.proxy('scroll-snap-align:`value`')
    assert.equal(proxy, 'scroll-snap-align:var(--mcss-syntax-value)')

    const declarations = generateDeclarations(proxy)
    assert.equal(declarations['scroll-snap-align'], 'var(--mcss-syntax-value)')

    const cssText = convertDeclarationsToCSS(declarations)
    const splitAt = cssText.indexOf('syntax-value')
    assert.notEqual(splitAt, -1)

    const restored = restoreText(placeholders, [
        cssText.slice(0, splitAt),
        cssText.slice(splitAt)
    ])
    assert.match(restored, /scroll-snap-align: <value>;/)
    assert.doesNotMatch(restored, /--mcss-syntax-value|var\(--mcss-syntax-value\)/)
})

test('uses the current syntax declarations before falling back to preview syntax', () => {
    assert.equal(
        generateSyntaxTrDeclarations('bg:red', 'bg:blue-60')?.['background-color'],
        'var(--color-red)'
    )
    assert.equal(
        generateSyntaxTrDeclarations('bg:#12345678', 'bg:blue-60')?.['background-color'],
        '#12345678'
    )
    assert.equal(
        generateSyntaxTrDeclarations('unknown:`value`', 'bg:blue-60')?.['background-color'],
        'var(--color-blue-60)'
    )
})

function generateDeclarations(className: string) {
    const rule = css.generate(className)[0]
    assert.ok(rule)
    return rule.declarations as Record<string, string>
}

function convertDeclarationsToCSS(obj: Record<string, string>) {
    let cssText = ''
    for (const property in obj) {
        if (Object.hasOwn(obj, property)) {
            cssText += `${property}: ${obj[property]};\n`
        }
    }
    return cssText
}

function restoreText(placeholders: ReturnType<typeof createSyntaxTrPlaceholderContext>, chunks: string[]) {
    const root: SyntaxTrHastNode = {
        type: 'root',
        children: chunks.map((value) => ({
            type: 'element',
            properties: {},
            children: [{ type: 'text', value }]
        }))
    }
    placeholders.restoreTextNodes(root)
    return collectText(root)
}

function collectText(node: SyntaxTrHastNode): string {
    if (node.type === 'text') return node.value ?? ''
    return node.children?.map(collectText).join('') ?? ''
}
