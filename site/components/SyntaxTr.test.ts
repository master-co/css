import assert from 'node:assert/strict'
import { access, readdir } from 'node:fs/promises'
import { test } from 'node:test'
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

test('restores syntax placeholders without styling the whole text token', () => {
  const placeholders = createSyntaxTrPlaceholderContext()
  const proxy = placeholders.proxy('mt:`size`')
  assert.equal(proxy, 'mt:100000000px')

  const root: SyntaxTrHastNode = {
    type: 'root',
    children: [{
      type: 'element',
      tagName: 'span',
      properties: { class: 'syntax-token' },
      children: [{ type: 'text', value: proxy }]
    }]
  }

  placeholders.restoreTextNodes(root)

  const token = root.children?.[0]
  const placeholder = token?.children?.[1]

  assert.equal(collectText(root), 'mt:<size>')
  assert.equal(token?.properties?.class, 'syntax-token')
  assert.deepEqual(token?.children?.[0], { type: 'text', value: 'mt:' })
  assert.equal(placeholder?.type, 'element')
  assert.equal(placeholder?.tagName, 'span')
  assert.equal(placeholder?.properties?.class, 'text:muted italic mr:0.125rem:not(:last)')
  assert.equal(collectText(placeholder ?? {}), '<size>')
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

test('proxies number without a unit and restores the placeholder in generated declarations', () => {
  const placeholders = createSyntaxTrPlaceholderContext()
  const proxy = placeholders.proxy('border-image-slice:`number`')
  assert.equal(proxy, 'border-image-slice:246813579')

  const declarations = generateDeclarations(proxy)
  assert.equal(declarations['border-image-slice'], '246813579')

  const restored = restoreText(placeholders, [convertDeclarationsToCSS(declarations)])
  assert.match(restored, /border-image-slice: <number>;/)
  assert.doesNotMatch(restored, /246813579/)
})

test('proxies hex placeholders inside color literals', () => {
  const placeholders = createSyntaxTrPlaceholderContext()
  const proxy = placeholders.proxy('fill:#`hex`')
  assert.equal(proxy, 'fill:#123456')

  const declarations = generateDeclarations(proxy)
  assert.equal(declarations.fill, '#123456')

  const restored = restoreText(placeholders, [convertDeclarationsToCSS(declarations)])
  assert.match(restored, /fill: #<hex>;/)
  assert.doesNotMatch(restored, /123456/)
})

test('proxies URL placeholders with valid URL values', () => {
  const placeholders = createSyntaxTrPlaceholderContext()
  const proxy = placeholders.proxy('filter:url(`svg`)')
  assert.equal(proxy, 'filter:url(#mcss-syntax-svg)')

  const declarations = generateDeclarations(proxy)
  assert.equal(declarations.filter, 'url(#mcss-syntax-svg)')

  const restored = restoreText(placeholders, [convertDeclarationsToCSS(declarations)])
  assert.match(restored, /filter: url\(<svg>\);/)
  assert.doesNotMatch(restored, /mcss-syntax-svg/)
})

test('proxies preset namespace placeholders and restores declaration values', () => {
  const placeholders = createSyntaxTrPlaceholderContext()
  const proxy = placeholders.proxy('animate:`name`')
  assert.equal(proxy, 'animate:fade')

  const declarations = generateDeclarations(proxy)
  assert.equal(declarations.animation, 'var(--animate-fade)')

  const restored = restoreText(placeholders, [
    proxy,
    '\n',
    convertDeclarationsToCSS(declarations)
  ])
  assert.match(restored, /animate:<name>/)
  assert.match(restored, /animation: <name>;/)
  assert.doesNotMatch(restored, /fade|--animate/)
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

test('throws when syntax and preview fallback generate empty declarations', () => {
  assert.throws(
    () => generateSyntaxTrDeclarations('appearance:push-button'),
    /SyntaxTr generated empty CSS declarations for `appearance:push-button`\./
  )
})

test('all reference syntaxes generate declarations without preview fallback', async () => {
  const referenceRootURL = new URL('../app/[locale]/reference/', import.meta.url)
  const entries = await readdir(referenceRootURL, { withFileTypes: true })
  const failures: string[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const syntaxURL = new URL(`${entry.name}/syntaxes.ts`, referenceRootURL)
    try {
      await access(syntaxURL)
    } catch {
      continue
    }

    const syntaxModule = await import(syntaxURL.href)
    for (const syntax of syntaxModule.default ?? []) {
      const value = Array.isArray(syntax) ? syntax[0] : syntax
      if (typeof value !== 'string') {
        failures.push(`${entry.name}: invalid syntax value ${String(value)}`)
        continue
      }

      const placeholders = createSyntaxTrPlaceholderContext()
      const proxy = placeholders.proxy(value)
      try {
        generateSyntaxTrDeclarations(proxy)
      } catch (error) {
        failures.push(`${entry.name}: ${value} -> ${proxy}: ${(error as Error).message}`)
      }
    }
  }

  assert.deepEqual(failures, [])
})

test('all reference syntaxes place nested rows after plain rows', async () => {
  const referenceRootURL = new URL('../app/[locale]/reference/', import.meta.url)
  const entries = await readdir(referenceRootURL, { withFileTypes: true })
  const failures: string[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const syntaxURL = new URL(`${entry.name}/syntaxes.ts`, referenceRootURL)
    try {
      await access(syntaxURL)
    } catch {
      continue
    }

    const syntaxModule = await import(syntaxURL.href)
    let nestedRowSeen = false
    for (const syntax of syntaxModule.default ?? []) {
      if (Array.isArray(syntax)) {
        nestedRowSeen = true
      } else if (nestedRowSeen) {
        failures.push(`${entry.name}: ${String(syntax)}`)
      }
    }
  }

  assert.deepEqual(failures, [])
})

function generateDeclarations(className: string) {
  return generateSyntaxTrDeclarations(className) as Record<string, string>
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
