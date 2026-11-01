import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import createHighlighter, { theme } from './create-highlighter'

const highlighter = await createHighlighter()
after(() => highlighter.dispose())

/** Assert each listed token on the given 1-based line renders with the role's color. */
function assertRoles(lang: string, source: string, expectations: [line: number, text: string, role: string][]) {
  const lines = highlighter.codeToTokens(source, { lang, theme }).tokens
  for (const [line, text, role] of expectations) {
    const token = lines[line - 1]?.find(token => token.content.trim() === text)
    assert.ok(token, `${lang} L${line}: «${text}» is a token in «${lines[line - 1]?.map(token => token.content).join('|')}»`)
    assert.equal(token.color, `var(--ui-code-${role})`, `${lang} L${line}: «${text}» → ${role}`)
  }
}

test('nested rules and conditional groups keep declarations in declaration blocks', () => {
  assertRoles('css', [
    '.btn {',
    '  &:hover { color: red; }',
    '  padding-inline: var(--spacing-md);',
    '  &:focus-visible,',
    '  & > .icon {',
    '    outline: none;',
    '  }',
    '  @media (width < 40rem) {',
    '    width: 100%;',
    '  }',
    '  transition: color .2s,',
    '    opacity .2s;',
    '}'
  ].join('\n'), [
    [2, '&', 'function'], [2, 'hover', 'keyword'], [2, 'color', 'property'], [2, 'red', 'string'],
    [3, 'padding-inline', 'property'],
    [4, 'focus-visible', 'keyword'], [5, 'icon', 'function'], [6, 'outline', 'property'],
    [8, '@media', 'keyword'], [8, 'width', 'property'], [8, '40rem', 'number'],
    [9, 'width', 'property'], [9, '100%', 'number'],
    [11, 'transition', 'property'], [11, '.2s', 'number']
  ])
})

test('modern at-rules, functions, properties and selectors read as CSS', () => {
  assertRoles('css', [
    '@property --angle { syntax: "<angle>"; inherits: false; }',
    '@view-transition { navigation: auto; }',
    '@container card (inline-size > 30rem) { .x { display: grid; } }',
    '@media (prefers-color-scheme: dark) { :root { --surface: light-dark(white, black); } }',
    '::view-transition-group(*), :host([data-theme]) { field-sizing: content; inset: env(safe-area-inset-top); }',
    '@supports selector(:has(a)) { a { color: red; } }',
    '<style>...</style>'
  ].join('\n'), [
    [1, '@property', 'keyword'], [1, '--angle', 'property'], [1, 'syntax', 'property'], [1, 'inherits', 'property'],
    [2, '@view-transition', 'keyword'], [2, 'navigation', 'property'],
    [3, '@container', 'keyword'], [3, 'inline-size', 'property'], [3, '30rem', 'number'], [3, 'display', 'property'],
    [4, 'prefers-color-scheme', 'property'], [4, 'dark', 'string'], [4, 'light-dark', 'function'],
    [5, 'view-transition-group', 'keyword'], [5, 'host', 'keyword'], [5, 'data-theme', 'property'],
    [5, 'field-sizing', 'property'], [5, 'env', 'function'],
    [6, 'selector', 'function'], [6, 'has', 'keyword']
  ])
  assertRoles('css', [
    '@custom-media --wide screen and (width >= 60rem);',
    '@import "vendor.css" layer(defaults) supports(display: grid);',
    '@keyframes fade { from { opacity: 0 } 50% { opacity: .5 } to { opacity: 1 } }',
    '.a { color: rgb(0 0 0 / 12%); }'
  ].join('\n'), [
    [1, '@custom-media', 'keyword'], [1, '--wide', 'property'], [1, 'screen', 'string'], [1, 'and', 'keyword'], [1, 'width', 'property'], [1, '60rem', 'number'],
    [2, 'layer', 'function'], [2, 'supports', 'function'], [2, 'display', 'property'],
    [3, 'from', 'keyword'], [3, '50%', 'number'], [3, 'to', 'keyword'],
    [4, '/', 'punctuation']
  ])
  assertRoles('css', '.dark {\n  --surface: #111;\n  color: var(--surface);\n}', [[2, '--surface', 'property'], [3, '--surface', 'text']])
})

test('stylesheets embedded in other documents receive the CSS and Master CSS additions', () => {
  const style = '<style>\n.card {\n  @apply --surface;\n  &:hover { color: light-dark(red, blue); }\n  padding: 0;\n}\n</style>'
  for (const lang of ['html', 'vue', 'svelte', 'astro']) {
    assertRoles(lang, style, [
      [3, '@apply', 'keyword'], [4, 'hover', 'keyword'], [4, 'color', 'property'], [4, 'light-dark', 'function'], [5, 'padding', 'property']
    ])
  }
  // An elided stylesheet closes, so the markup after it stays markup.
  assertRoles('html', '<style id="m">...</style>\n<body></body>', [[1, '...', 'comment'], [2, 'body', 'function']])
})

test('CSS-in-JS templates read as declarations without disturbing the script around them', () => {
  const source = [
    'const Button = styled.button`',
    '  background: ${({ theme }) => theme.primary};',
    '  &:hover { opacity: .8; }',
    '`',
    'const Card = styled(Box)`gap: 1rem;`',
    'export const Reset = () => <Global styles={css`body { margin: 0; }`} />',
    'const label = `plain ${name}`'
  ].join('\n')
  for (const lang of ['tsx', 'jsx']) {
    assertRoles(lang, source, [
      [1, 'const', 'keyword'], [1, 'button', 'function'],
      [2, 'background', 'property'], [2, '=>', 'keyword'], [2, 'primary', 'property'],
      [3, 'hover', 'keyword'], [3, 'opacity', 'property'], [3, '.8', 'number'],
      [5, 'const', 'keyword'], [5, 'gap', 'property'], [5, '1rem', 'number'],
      [6, 'Global', 'function'], [6, 'body', 'function'], [6, 'margin', 'property'],
      [7, 'const', 'keyword'], [7, '`plain', 'string']
    ])
  }
})

test('embedding grammars keep their own injections', () => {
  assertRoles('vue', '<template>\n  <p :class="classes" @click="open()" v-if="ok">{{ title.trim() }}</p>\n</template>', [
    [2, 'class', 'property'], [2, 'classes', 'text'], [2, 'open', 'function'], [2, 'v-if', 'keyword'], [2, 'trim', 'function']
  ])
  for (const lang of ['markdown', 'mdx']) {
    assertRoles(lang, '```css\n.a { &:hover { color: red; } }\n```', [[2, 'hover', 'keyword'], [2, 'color', 'property']])
  }
})

test('valid markup that grammars mark invalid keeps its host role', () => {
  assertRoles('html', '<body>\n  <Routes />\n  <link href="/assets/app.<hash>.css">\n</body>', [
    [2, 'Routes', 'function'], [3, '"/assets/app.<hash>.css"', 'string']
  ])
})

test('word operators read as keywords while symbols and brackets read as punctuation', () => {
  assertRoles('ts', [
    "const m = await import('./a.js')",
    'if (typeof value === "string" && value instanceof Text) new URL(value)',
    'type Key = keyof Options'
  ].join('\n'), [
    [1, 'import', 'keyword'], [1, ')', 'punctuation'],
    [2, 'typeof', 'keyword'], [2, '===', 'punctuation'], [2, 'instanceof', 'keyword'], [2, 'new', 'keyword'],
    [3, 'keyof', 'keyword']
  ])
  assertRoles('css', '@media screen and (width > 1px) {}', [[1, 'and', 'keyword']])
  assertRoles('toml', '[server]\ncommand = "npx"', [[2, 'command', 'property']])
})
