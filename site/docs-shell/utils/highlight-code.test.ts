import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import type { Element, Root, RootContent } from 'hast'
import highlightCode from './highlight-code'
import highlightedCodeText from './highlighted-code-text'

test('highlightCode renders Master CSS semantic spans only for CSS directive class lists', async () => {
  const hast = await highlightCode([
    '@theme {',
    '    --color-primary: var(--color-blue-60);',
    '}',
    '@components {',
    '    btn { @compose inline-flex text:red:hover@md; }',
    '}'
  ].join('\n'), { lang: 'css' })

  assert.equal(hasSemanticClass(hast, 'mcss-semantic-keyword-directive'), false)
  assert.equal(hasSemanticClass(hast, 'mcss-semantic-role-theme-variable'), false)
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-utility-semantic'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-declaration-property'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-selector-pseudoClass-name'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-query-keyword'))
})

test('highlightCode keeps directive and query colors aligned with native CSS in both themes', async () => {
  const source = [
    '@import "base.css";',
    '@theme light { --color-brand: red; }',
    '@components { btn { @compose fg:red@md; @variant <sm { color: red; } } }',
    '@custom-variant motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }'
  ].join('\n')
  const hast = await highlightCode(source, { lang: 'css' })
  const styleOf = (text: string, semantic = false) => {
    let style: string | undefined
    visitElements(hast.children, (element) => {
      if (element.tagName === 'span' && getTextContent(element) === text
        && (!semantic || hasClassName(element, 'mcss-semantic-keyword-query'))) {
        style = element.properties?.style as string | undefined
      }
    })
    assert.ok(style, text)
    return style
  }

  assert.equal(highlightedCodeText(hast), source)
  for (const keyword of ['@theme', '@components', '@compose', '@custom-variant', '@media', '@slot']) {
    assert.equal(styleOf(keyword), styleOf('@import'), keyword)
  }
  assert.equal(styleOf('@md', true), styleOf('@import'))
  assert.notEqual(styleOf('sm'), styleOf('<'))
})

test('highlightCode leaves guide theme native values to TextMate without marking comments', async () => {
  const hast = await highlightCode([
    '@theme light {',
    '    /* Font families */',
    '    --tracking-tightest: -0.072em;',
    '}'
  ].join('\n'), { lang: 'css' })

  assert.equal(collectSemanticElements(hast).length, 0)
  assert.equal(hasSemanticClass(hast, 'mcss-semantic-role-directive-parameter'), false)
  assert.equal(hasSemanticClass(hast, 'mcss-semantic-role-theme-variable'), false)
  assert.equal(hasSemanticClass(hast, 'mcss-semantic-role-value-operator'), false)
  assert.equal(hasSemanticClass(hast, 'mcss-semantic-role-value-number'), false)
  assert.equal(hasSemanticClass(hast, 'mcss-semantic-role-value-unit'), false)
  assert.equal(collectSemanticElements(hast).some((element) => getTextContent(element).includes('Font families')), false)
})

test('highlightCode renders Master CSS semantic spans in HTML class attributes', async () => {
  const hast = await highlightCode('<div class="text:red:hover@md block"></div>', { lang: 'html' })
  const hostWrapper = collectElementsByClass(hast, 'mcss-host-role-class-attribute-value')[0]

  assert.ok(hostWrapper)
  assert.equal(getTextContent(hostWrapper), 'text:red:hover@md block')
  assert.equal(hostWrapper.properties?.['data-master-css-host-role'], 'class-attribute-value')
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-declaration-property'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-value-keyword'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-selector-pseudoClass-name'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-query-keyword'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-utility-semantic'))
})

test('highlightCode renders Master CSS semantic spans in TSX class attributes', async () => {
  const hast = await highlightCode('<div className="text:red:hover@md block" />', { lang: 'tsx' })

  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-declaration-property'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-value-keyword'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-query-keyword'))
})

test('highlightCode treats mcss snippets as plaintext with class-list semantic overlay', async () => {
  const hast = await highlightCode('text:red:hover@md {bg:blue;fg:white}', {
    lang: 'mcss',
    inline: true
  })

  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-declaration-property'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-value-keyword'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-block-brace'))
  assert.ok(hasSemanticClass(hast, 'mcss-semantic-role-query-keyword'))
})

test('highlightCode does not render Master CSS semantic spans for native-only CSS', async () => {
  const hast = await highlightCode([
    '@keyframes fade {',
    '    from { opacity: 0; }',
    '    to { opacity: 1; }',
    '}',
    '.card:hover::before {',
    '    --distance: calc(100% - 1rem);',
    '    color: oklch(99% 0.0033 72);',
    '}'
  ].join('\n'), { lang: 'css' })

  assert.equal(collectSemanticElements(hast).length, 0)
})

test('highlightCode preserves authored block indentation for code block dedent', async () => {
  const hast = await highlightCode([
    'app/',
    '  globals.css',
    '  home/',
    '    page.tsx',
    '    home.css'
  ].join('\n'), { lang: 'txt', dedent: 'block' })

  assert.deepEqual(collectLineTexts(hast), [
    'app/',
    '  globals.css',
    '  home/',
    '    page.tsx',
    '    home.css'
  ])
})

test('highlightCode removes incidental outer indentation for indented code blocks', async () => {
  const hast = await highlightCode([
    '            import "./home.css"',
    '            export default function Page() {}'
  ].join('\n'), { lang: 'ts', dedent: 'block' })

  assert.deepEqual(collectLineTexts(hast), [
    'import "./home.css"',
    'export default function Page() {}'
  ])
})

test('copy text follows rendered indentation, formatting, and removed mark directives', async () => {
  const indented = await highlightCode('    <div>\n      <span>Text</span>\n    </div>', { lang: 'html', dedent: 'block' })
  assert.equal(highlightedCodeText(indented), '<div>\n  <span>Text</span>\n</div>')

  const formatted = await highlightCode('a{color:red}', { lang: 'css', beautify: true })
  assert.equal(highlightedCodeText(formatted), 'a {\n  color: red\n}')

  const marked = await highlightCode('<!-- @MARK text:red -->\n<div class="text:red">Text</div>', { lang: 'html' })
  assert.equal(highlightedCodeText(marked), '<div class="text:red">Text</div>')

  const diff = await highlightCode('color: red; /* [!code ++] */', { lang: 'css' })
  assert.equal(highlightedCodeText(diff), 'color: red;')
})

function hasSemanticClass(root: Root, className: string): boolean {
  return collectSemanticElements(root).some((element) => hasClassName(element, className))
}

function collectLineTexts(root: Root): string[] {
  const lines: string[] = []
  visitElements(root.children, (element) => {
    if (hasClassName(element, 'line')) {
      lines.push(getTextContent(element))
    }
  })
  return lines
}

function collectSemanticElements(root: Root): Element[] {
  const elements: Element[] = []
  visitElements(root.children, (element) => {
    if (getClassNames(element).some((className) => className.startsWith('mcss-semantic'))) {
      elements.push(element)
    }
  })
  return elements
}

function collectElementsByClass(root: Root, className: string): Element[] {
  const elements: Element[] = []
  visitElements(root.children, (element) => {
    if (hasClassName(element, className)) {
      elements.push(element)
    }
  })
  return elements
}

function visitElements(children: RootContent[], callback: (element: Element) => void) {
  for (const child of children) {
    if (child.type !== 'element') continue
    callback(child)
    visitElements(child.children as RootContent[], callback)
  }
}

function hasClassName(element: Element, className: string): boolean {
  return getClassNames(element).includes(className)
}

function getClassNames(element: Element): string[] {
  const classes = element.properties?.class
  if (Array.isArray(classes)) return classes.flatMap((value) => typeof value === 'string' ? value.split(/\s+/) : [])
  if (typeof classes === 'string') return classes.split(/\s+/)
  return []
}

function getTextContent(node: RootContent): string {
  if (node.type === 'text') return node.value
  if (node.type !== 'element') return ''
  return (node.children as RootContent[]).map(getTextContent).join('')
}
