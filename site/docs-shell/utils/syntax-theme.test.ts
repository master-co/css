import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import type { Root, RootContent } from 'hast'
import createHighlighter, { theme } from './create-highlighter'
import highlightCode from './highlight-code'
import highlightedCodeText from './highlighted-code-text'

const highlighter = await createHighlighter()
after(() => highlighter.dispose())

test('native grammars distinguish names, values and structure with the shared roles', () => {
  const examples = [
    {
      lang: 'css',
      source: '/* Card */\n@theme { --color-brand: teal; }\n.card:hover { color: var(--color-brand); padding: 1rem; display: grid; content: "Ready"; }',
      roles: { '/* Card */': 'comment', '@theme': 'keyword', card: 'function', hover: 'keyword', color: 'property', var: 'function', '--color-brand': 'text', '1rem': 'number', grid: 'string', '"Ready"': 'string', ':': 'punctuation' }
    },
    {
      lang: 'tsx',
      source: '// Card\nconst count: number = 3;\nexport function Card() { return <button disabled={false} className="p-md">Ready</button> }',
      roles: { '// Card': 'comment', const: 'keyword', count: 'text', number: 'function', Card: 'function', button: 'function', disabled: 'property', false: 'number', className: 'property', '"p-md"': 'string', Ready: 'text' }
    },
    {
      lang: 'json',
      source: '{ "name": "card", "count": 3, "enabled": true }',
      roles: { name: 'property', '"card"': 'string', '3': 'number', true: 'number' }
    },
    {
      lang: 'bash',
      source: '# Build\npnpm run build --filter "site"',
      roles: { '# Build': 'comment', pnpm: 'function', '"site"': 'string' }
    }
  ]

  for (const { lang, source, roles } of examples) {
    const tokens = highlighter.codeToTokens(source, { lang, theme }).tokens.flat()
    for (const [text, role] of Object.entries(roles)) {
      assert.ok(tokens.some(token => token.content.trim() === text && token.color === `var(--color-code-${role})`), `${lang}: ${text} → ${role}`)
    }
  }
})

test('every site language renders copyable text with the adaptive palette', async () => {
  const snippets = {
    html: '<p class="p-md">Hello</p>',
    javascript: 'const value = "hello"',
    typescript: 'const value: string = "hello"',
    jsx: 'const view = <p className="p-md">Hello</p>',
    tsx: 'const view = <p className="p-md">Hello</p>',
    css: '@theme { --color-brand: teal; }',
    scss: '$gap: 1rem; .card { padding: $gap; }',
    json: '{ "value": true }',
    vue: '<template><p class="p-md">Hello</p></template>',
    svelte: '<p class="p-md">Hello</p>',
    astro: '<p class="p-md">Hello</p>',
    markdown: '# Hello\n\nSome `code`.',
    mdx: '# Hello\n\n<Card title="Hello" />',
    bash: 'echo "hello"',
    'angular-html': '<p class="p-md">{{ title }}</p>',
    toml: 'title = "Hello"',
    erb: '<p class="p-md"><%= title %></p>',
    liquid: '<p class="p-md">{{ title }}</p>',
    php: '<?php echo "hello"; ?>',
    mcss: 'p-md fg-text-blue:hover@sm',
    plaintext: 'app/\n  globals.css'
  }

  for (const [lang, source] of Object.entries(snippets)) {
    for (const inline of [false, true]) {
      const tree = await highlightCode(source, { lang, inline, dedent: false })
      assert.equal(inline ? textContent(tree) : highlightedCodeText(tree), source, `${lang}, inline=${inline}`)
      assert.doesNotMatch(JSON.stringify(tree), /--shiki-(?:dark|light)|dracula|min-light/)
      if (lang !== 'plaintext') assert.match(JSON.stringify(tree), /var\(--color-code-/)
    }
  }
})

function textContent(node: Root | RootContent): string {
  if (node.type === 'text') return node.value
  return 'children' in node ? node.children.map(textContent).join('') : ''
}
