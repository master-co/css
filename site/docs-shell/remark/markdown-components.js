import { parse, parseExpressionAt } from 'acorn'
import { visit, SKIP } from 'unist-util-visit'

/** Paragraph markers that turn a Markdown paragraph into a callout or a gesture hint. */
const paragraphMarkers = [
  ['(o) ', 'Do'],
  ['(x) ', 'DoNot'],
  ['(i) ', 'Info'],
  ['(!) ', 'Warn'],
  ['(!|) ', 'Warn', { leaded: true }],
  ['(hover) ', 'InteractingIndicator', { icon: 'hover' }],
  ['(resize) ', 'InteractingIndicator', { icon: 'resize' }],
  ['(click) ', 'InteractingIndicator', { icon: 'click' }],
  ['(type) ', 'InteractingIndicator', { icon: 'type' }],
  ['(wand) ', 'InteractingIndicator', { icon: 'wand' }]
]

/** Inline code may lead with its grammar, as in `html <div>`. */
const inlineLanguages = new Set(['html', 'js', 'ts', 'css', 'json', 'mcss'])

function attribute(name, value) {
  if (typeof value === 'string') return { type: 'mdxJsxAttribute', name, value }
  const source = JSON.stringify(value)
  const expression = parseExpressionAt(source, 0, { ecmaVersion: 'latest' })
  return {
    type: 'mdxJsxAttribute',
    name,
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value: source,
      data: { estree: { type: 'Program', sourceType: 'module', body: [{ type: 'ExpressionStatement', expression }] } }
    }
  }
}

function element(type, name, props, children = []) {
  return { type, name, attributes: Object.entries(props).filter(([, value]) => value !== undefined).map(([key, value]) => attribute(key, value)), children }
}

/** Fence meta reads as URL parameters whose values may be JSON, as in ```html name=index.html beautify=true. */
function fenceProps(node) {
  const props = { name: '', lang: '', dedent: 'block' }
  if (node.meta) {
    for (const [key, value] of new URLSearchParams(node.meta.trim())) {
      try {
        props[key] = JSON.parse(value)
      } catch {
        props[key] = value
      }
    }
  }
  if (!props.lang) props.lang = node.lang ?? ''
  return props
}

const componentsExport = `import { markdownComponents as __markdownComponents } from '~/site/docs-shell/components/markdown-components'
export const components = __markdownComponents`

/**
 * Markdown constructs that render through site components: fences become `Code` (or a
 * package-manager `PMAction`), inline code becomes `InlineCode`, and marked paragraphs become
 * callouts. Every MDX module exports the site's `components`, so imported MDX renders the same way.
 */
export default function remarkMarkdownComponents() {
  return (tree) => {
    tree.children.unshift({
      type: 'mdxjsEsm',
      value: componentsExport,
      data: { estree: parse(componentsExport, { ecmaVersion: 'latest', sourceType: 'module' }) }
    })
    visit(tree, (node, index, parent) => {
      if (!parent || index === undefined) return
      if (node.type === 'code') {
        const props = fenceProps(node)
        // Markdown fences end with a newline, as their `<pre>` text did.
        const code = node.value ? node.value + '\n' : ''
        parent.children[index] = props.lang === 'bash' && props.action
          ? element('mdxJsxFlowElement', 'PMAction', { action: props.action, code: node.value })
          : element('mdxJsxFlowElement', 'Code', { ...props, code })
        return SKIP
      }
      if (node.type === 'inlineCode') {
        const [first, ...rest] = node.value.split(' ')
        const lang = rest.length && inlineLanguages.has(first) ? first : ''
        parent.children[index] = element('mdxJsxTextElement', 'InlineCode', { lang, code: lang ? rest.join(' ') : node.value })
        return SKIP
      }
      if (node.type === 'paragraph') {
        const first = node.children[0]
        if (first?.type !== 'text') return
        const marker = paragraphMarkers.find(([prefix]) => first.value.startsWith(prefix))
        if (!marker) return
        const [prefix, name, props = {}] = marker
        first.value = first.value.slice(prefix.length)
        parent.children[index] = element('mdxJsxFlowElement', name, props, node.children)
        // Visit the callout again so its inline code becomes `InlineCode` too.
        return index
      }
    })
  }
}
