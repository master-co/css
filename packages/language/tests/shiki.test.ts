import { expect, test } from 'vitest'
import { createHighlighter } from 'shiki'
import sharedTextMateGrammar from '../syntaxes/master-css.tmLanguage.json' with { type: 'json' }

import masterCSSShikiLanguages, {
  MASTER_CSS_TEXTMATE_GRAMMAR,
  createMasterCSSShikiDecorations,
  getMasterCSSShikiLanguageId,
  isMasterCSSClassListLanguage,
  isMasterCSSShikiSupportedLanguage,
  masterCSSShikiLanguage,
  transformerMasterCSS
} from '../src/shiki'
import type { MasterCSSShikiOptions } from '../src/shiki'
import { createPresetManifest } from './helpers/create-preset-manifest'

const manifest: MasterCSSShikiOptions['manifest'] = createPresetManifest({
  variables: [{ key: 'brand', value: '#123456' }],
  utilities: [
    {
      name: 'btn',
      layer: 'components',
      rules: [
        { selector: '&', declarations: { display: 'block' } }
      ]
    }
  ]
})

function scopeToken(scopeName: string, color: string) {
  return [
    {
      content: scopeName,
      offset: 0,
      color,
      explanation: [
        {
          scopes: [
            { scopeName }
          ]
        }
      ]
    }
  ]
}

function semanticScopeStyleTokens() {
  return [
    ...scopeToken('keyword.control.at-rule.master-css', 'keyword'),
    ...scopeToken('support.type.property-name.master-css', 'property'),
    ...scopeToken('support.constant.property-value.master-css', 'value'),
    ...scopeToken('entity.other.attribute-name.class.master-css', 'class'),
    ...scopeToken('storage.modifier.master-css', 'modifier'),
    ...scopeToken('variable.other.master-css', 'variable'),
    ...scopeToken('variable.css', 'variable'),
    ...scopeToken('entity.name.tag.css', 'type'),
    ...scopeToken('entity.other.attribute-name.class.css', 'class'),
    ...scopeToken('entity.other.attribute-name.id.css', 'id'),
    ...scopeToken('entity.other.attribute-name.pseudo-class.css', 'modifier'),
    ...scopeToken('entity.other.attribute-name.pseudo-element.css', 'pseudo-element'),
    ...scopeToken('keyword.operator.css', 'operator'),
    ...scopeToken('keyword.operator.combinator', 'selector-operator'),
    ...scopeToken('keyword.other.important.css', 'important'),
    ...scopeToken('keyword.other.unit.rem.css', 'unit'),
    ...scopeToken('constant.numeric.css', 'number'),
    ...scopeToken('support.function.misc.css', 'function'),
    ...scopeToken('string.quoted.css', 'string')
  ]
}

const shikiSmokeTheme = 'github-dark'

interface ShikiContentToken {
  content: string
}

interface TextMatePattern {
  include?: string
  begin?: string
  match?: string
  name?: string
  patterns?: TextMatePattern[]
  beginCaptures?: Record<string, { name?: string }>
  captures?: Record<string, { name?: string }>
}

function expectTokensPreserveSource(tokens: ShikiContentToken[][], code: string) {
  expect(tokens.map((lineTokens) => lineTokens.map((token) => token.content).join(''))).toEqual(code.split('\n'))
}

function grammarEntry(key: string) {
  const entry = MASTER_CSS_TEXTMATE_GRAMMAR.repository[key] as { patterns?: TextMatePattern[] } | undefined
  expect(entry?.patterns).toBeDefined()
  return entry as { patterns: TextMatePattern[] }
}

function findGrammarPattern(entry: { patterns: TextMatePattern[] }, predicate: (pattern: TextMatePattern) => boolean) {
  const pattern = entry.patterns.find(predicate)
  expect(pattern).toBeDefined()
  return pattern as TextMatePattern
}

function expectGrammarIncludes(entry: { patterns: TextMatePattern[] }, includes: string[]) {
  expect(entry.patterns).toEqual(expect.arrayContaining(
    includes.map((include) => expect.objectContaining({ include }))
  ))
}

test.concurrent('exports Shiki language registrations as a default array', async () => {
  expect(masterCSSShikiLanguages).toEqual([masterCSSShikiLanguage])
  expect((await import('../src/shiki')).default).toBe(masterCSSShikiLanguages)
})

test.concurrent('defines deterministic TextMate grammar scopes for CSS directives', () => {
  expect(MASTER_CSS_TEXTMATE_GRAMMAR).toBe(sharedTextMateGrammar)
  expect(masterCSSShikiLanguage.scopeName).toBe(sharedTextMateGrammar.scopeName)
  expect(masterCSSShikiLanguage.injectTo).toEqual([
    'source.css',
    'source.css.scss',
    'source.css.less',
    'source.css.postcss'
  ])

  const directive = grammarEntry('master-directive')
  const themeDirective = findGrammarPattern(directive, (pattern) => pattern.begin === '(@)(theme)\\b')
  const managedDirective = findGrammarPattern(directive, (pattern) => pattern.begin === '(@)(defaults|components|utilities)\\b')
  const composeDirective = findGrammarPattern(directive, (pattern) => pattern.begin === '(@)(compose)\\b')

  expect(themeDirective.beginCaptures?.['2']?.name).toBe('keyword.control.at-rule.master-css')
  expect(managedDirective.beginCaptures?.['2']?.name).toBe('keyword.control.at-rule.master-css')
  expect(composeDirective.beginCaptures?.['2']?.name).toBe('keyword.control.at-rule.master-css')
  expectGrammarIncludes({ patterns: themeDirective.patterns ?? [] }, ['#master-theme-block', '#master-theme-prelude'])
  expectGrammarIncludes({ patterns: managedDirective.patterns ?? [] }, ['#master-managed-block'])
  expectGrammarIncludes({ patterns: composeDirective.patterns ?? [] }, ['#master-compose-prelude'])

  const themeBlock = grammarEntry('master-theme-block')
  expectGrammarIncludes({ patterns: themeBlock.patterns[0]?.patterns ?? [] }, [
    '#master-theme-declaration',
    '#master-keyframes',
    '#master-directive'
  ])

  const themeValue = grammarEntry('master-theme-value')
  findGrammarPattern(themeValue, (pattern) => pattern.match === '\\$[_a-zA-Z-][_a-zA-Z0-9-]*' && pattern.name === 'variable.other.master-css')

  const composePrelude = grammarEntry('master-compose-prelude')
  expectGrammarIncludes(composePrelude, ['#master-string', '#master-query', '#master-selector', '#master-class-fragment'])

  const classFragment = grammarEntry('master-class-fragment')
  findGrammarPattern(classFragment, (pattern) => pattern.name === 'support.constant.property-value.master-css')
  findGrammarPattern(classFragment, (pattern) => pattern.name === 'entity.other.attribute-name.class.master-css')
  findGrammarPattern(classFragment, (pattern) => pattern.name === 'keyword.control.at-rule.master-css.query')
  const propertyFragment = findGrammarPattern(classFragment, (pattern) => pattern.captures?.['1']?.name === 'support.type.property-name.master-css')
  expect(propertyFragment.captures?.['2']?.name).toBe('keyword.operator.master-css')
})

test('supports Shiki dynamic language imports', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', import('../src/shiki')]
  })

  try {
    expect(highlighter.getLoadedLanguages()).toEqual(expect.arrayContaining(['css', masterCSSShikiLanguage.name]))

    const code = '@theme { --color-primary: $value; }'
    const result = highlighter.codeToTokens(code, {
      lang: 'css',
      theme: shikiSmokeTheme
    })

    expectTokensPreserveSource(result.tokens, code)
  } finally {
    await highlighter.dispose?.()
  }
})

test('registers a real Shiki TextMate injection grammar for CSS directives', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', masterCSSShikiLanguage]
  })

  try {
    expect(highlighter.getLoadedLanguages()).toEqual(expect.arrayContaining(['css', masterCSSShikiLanguage.name]))

    const code = [
      '@theme {',
      '    --color-primary: $color-blue-60;',
      '}',
      '@components {',
      '    btn {',
      '        @compose inline-flex fg:primary:hover@md;',
      '    }',
      '}',
      '@keyframes fade {',
      '    from { opacity: 0; }',
      '    to { opacity: 1; }',
      '}'
    ].join('\n')
    const result = highlighter.codeToTokens(code, {
      lang: 'css',
      theme: shikiSmokeTheme
    })

    expectTokensPreserveSource(result.tokens, code)
  } finally {
    await highlighter.dispose?.()
  }
})

test('keeps guide theme snippets correct with TextMate only', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', masterCSSShikiLanguage]
  })

  try {
    const code = [
      '@theme light {',
      '    /* Font families */',
      '    --tracking-tightest: -0.072em;',
      '}'
    ].join('\n')
    const result = highlighter.codeToTokens(code, {
      lang: 'css',
      theme: shikiSmokeTheme
    })

    expectTokensPreserveSource(result.tokens, code)
  } finally {
    await highlighter.dispose?.()
  }
})

test.concurrent('does not attach semantic metadata to guide theme CSS directive syntax', () => {
  const code = [
    '@theme light {',
    '    /* Font families */',
    '    --tracking-tightest: -0.072em;',
    '}'
  ].join('\n')
  const transformer = transformerMasterCSS({ matchCSSSyntaxStyles: false })
  const transformedTokens = transformer.tokens.call({
    source: code,
    options: { lang: 'css' }
  }, [[{ content: code, offset: 0, htmlStyle: { color: 'host' } }]])

  expect(transformedTokens).toBeUndefined()
  expect(createMasterCSSShikiDecorations(code, { lang: 'css' })).toEqual([])
})

test.concurrent('does not resolve guide theme CSS directive syntax through semantic scope styles', () => {
  const code = [
    '@theme light {',
    '    --tracking-tightest: -0.072em;',
    '}'
  ].join('\n')
  const transformer = transformerMasterCSS({ manifest })
  const transformedTokens = transformer.tokens.call({
    source: code,
    options: { lang: 'css' },
    codeToTokens: () => ({
      tokens: [semanticScopeStyleTokens()]
    })
  }, [[{ content: code, offset: 0, htmlStyle: { color: 'host' } }]])

  expect(transformedTokens).toBeUndefined()
})

test.concurrent('does not create Master Shiki decorations for native-only CSS', () => {
  const code = [
    '@keyframes fade {',
    '    from { opacity: 0; transform: translateX(0); }',
    '    to { opacity: 1; transform: translateX(var(--distance)); }',
    '}',
    '.card:hover::before {',
    '    --distance: calc(100% - 1rem);',
    '    color: oklch(99% 0.0033 72);',
    '}'
  ].join('\n')

  expect(createMasterCSSShikiDecorations(code, { lang: 'css' })).toEqual([])
})

test.concurrent('normalizes Shiki language ids separately from class-list languages', () => {
  expect(getMasterCSSShikiLanguageId('js')).toBe('javascript')
  expect(getMasterCSSShikiLanguageId('jsx')).toBe('jsx')
  expect(getMasterCSSShikiLanguageId('tsx')).toBe('tsx')
  expect(getMasterCSSShikiLanguageId('angular-html')).toBe('angular-html')
  expect(getMasterCSSShikiLanguageId('md')).toBe('markdown')
  expect(isMasterCSSShikiSupportedLanguage('typescriptreact')).toBe(true)
  expect(isMasterCSSShikiSupportedLanguage('mcss')).toBe(false)
  expect(isMasterCSSClassListLanguage('mcss')).toBe(true)
  expect(isMasterCSSClassListLanguage('master-css')).toBe(true)
})

test.concurrent('creates Shiki decorations from Master CSS semantic tokens', () => {
  const code = '<div className="fg:brand:hover@sm block btn btn:hover@sm btn_div::before"></div>'
  const decorations = createMasterCSSShikiDecorations(code, {
    lang: 'tsx',
    manifest
  })
  const tokens = decorations.map((decoration) => ({
    text: code.slice(decoration.start, decoration.end),
    type: decoration.type,
    modifiers: decoration.modifiers,
    classNames: decoration.properties?.class
  }))

  expect(tokens).toEqual(expect.arrayContaining([
    expect.objectContaining({
      text: 'fg',
      type: 'property',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-property', 'mcss-semantic-role-declaration-property'])
    }),
    expect.objectContaining({
      text: 'brand',
      type: 'variable',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-variable', 'mcss-semantic-role-value-variable'])
    }),
    expect.objectContaining({
      text: 'block',
      type: 'enumMember',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-enumMember', 'mcss-semantic-role-utility-semantic'])
    }),
    expect.objectContaining({
      text: 'btn',
      type: 'class',
      modifiers: ['declaration', 'component'],
      classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-class', 'mcss-semantic-role-utility-component', 'mcss-semantic-class-declaration', 'mcss-semantic-class-component'])
    }),
    expect.objectContaining({
      text: 'div',
      type: 'type',
      modifiers: ['selector'],
      classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-type', 'mcss-semantic-role-selector-type', 'mcss-semantic-type-selector'])
    }),
    expect.objectContaining({
      text: 'before',
      type: 'modifier',
      modifiers: ['pseudoElement'],
      classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-modifier', 'mcss-semantic-role-selector-pseudoElement-name', 'mcss-semantic-modifier-pseudoElement'])
    }),
    expect.objectContaining({
      text: '@sm',
      type: 'keyword',
      modifiers: ['query'],
      classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-keyword', 'mcss-semantic-role-query-keyword', 'mcss-semantic-keyword-query'])
    })
  ]))
  expect(tokens.filter(({ text, type, modifiers }) => text === 'btn' && type === 'class' && modifiers.includes('declaration') && modifiers.includes('component'))).toHaveLength(3)
})

test.concurrent('creates Shiki decorations for CSS directive class-list spans', () => {
  const code = [
    '@safelist "block fg:red";',
    '@utilities {',
    '    text-<left|center|right> {',
    '        text-align: --value();',
    '    }',
    '',
    '    font:<~font-size|number> {',
    '        font-size: --value();',
    '    }',
    '',
    '    grid-cols:<number> {',
    '        grid-template-columns: repeat(--value(), minmax(0, 1fr));',
    '    }',
    '}',
    '@components {',
    '    btn {',
    '        @compose inline-flex fg:brand:hover@sm;',
    '    }',
    '}'
  ].join('\n')
  const decorations = createMasterCSSShikiDecorations(code, {
    lang: 'css',
    manifest
  })
  const tokens = decorations.map((decoration) => ({
    text: code.slice(decoration.start, decoration.end),
    type: decoration.type,
    modifiers: decoration.modifiers,
    classNames: decoration.properties?.class
  }))

  expect(tokens).toEqual(expect.arrayContaining([
    expect.objectContaining({
      text: 'block',
      type: 'enumMember',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic-role-utility-semantic'])
    }),
    expect.objectContaining({
      text: 'fg',
      type: 'property',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic-role-declaration-property'])
    }),
    expect.objectContaining({
      text: 'red',
      type: 'enumMember',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic-role-value-keyword'])
    }),
    expect.objectContaining({
      text: 'inline-flex',
      type: 'enumMember',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic-role-utility-semantic'])
    }),
    expect.objectContaining({
      text: 'brand',
      type: 'variable',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic-role-value-variable'])
    }),
    expect.objectContaining({
      text: 'hover',
      type: 'modifier',
      modifiers: ['pseudoClass'],
      classNames: expect.arrayContaining(['mcss-semantic-role-selector-pseudoClass-name'])
    }),
    expect.objectContaining({
      text: '@sm',
      type: 'keyword',
      modifiers: ['query'],
      classNames: expect.arrayContaining(['mcss-semantic-role-query-keyword'])
    })
  ]))
  expect(tokens).not.toEqual(expect.arrayContaining([
    expect.objectContaining({ text: 'text-' }),
    expect.objectContaining({ text: 'left' }),
    expect.objectContaining({ text: 'font' }),
    expect.objectContaining({ text: '--value' })
  ]))
})

test.concurrent('creates Shiki decorations for raw Master CSS class lists', () => {
  const code = 'fg:brand:hover@sm {bg:blue;fg:white}'
  const decorations = createMasterCSSShikiDecorations(code, {
    lang: 'mcss',
    classList: true,
    manifest
  })
  const tokens = decorations.map((decoration) => ({
    text: code.slice(decoration.start, decoration.end),
    type: decoration.type,
    modifiers: decoration.modifiers
  }))

  expect(tokens).toEqual(expect.arrayContaining([
    { text: 'fg', type: 'property', modifiers: [] },
    { text: 'brand', type: 'variable', modifiers: [] },
    { text: 'hover', type: 'modifier', modifiers: ['pseudoClass'] },
    { text: '@sm', type: 'keyword', modifiers: ['query'] },
    { text: '{', type: 'operator', modifiers: [] },
    { text: ';', type: 'operator', modifiers: [] },
    { text: '}', type: 'operator', modifiers: [] }
  ]))
})

test.concurrent('skips semantic token decorations inside host comments', () => {
  const code = '<!-- <div class="fg:red"></div> -->\n<div class="fg:blue"></div>'
  const decorations = createMasterCSSShikiDecorations(code, {
    lang: 'html'
  })
  const texts = decorations.map((decoration) => code.slice(decoration.start, decoration.end))

  expect(texts).toContain('blue')
  expect(texts).not.toContain('red')
})

test.concurrent('applies semantic token styles by type and modifier', () => {
  const code = '<div class="block block:hover btn:hover"></div>'
  const decorations = createMasterCSSShikiDecorations(code, {
    lang: 'html',
    manifest,
    semanticTokenStyles: {
      enumMember: {
        color: 'var(--mcss-semantic-value)',
        '--shiki-dark': 'var(--mcss-semantic-value-dark)'
      },
      class: {
        color: 'var(--mcss-semantic-class)',
        '--shiki-dark': 'var(--mcss-semantic-class-dark)'
      },
      'class.declaration': {
        'font-weight': '600'
      }
    }
  })
  const enumMemberDecorations = decorations.filter((decoration) => decoration.type === 'enumMember')
  const classDecorations = decorations.filter((decoration) => decoration.type === 'class')
  const blockStyles = enumMemberDecorations
    .filter((decoration) => code.slice(decoration.start, decoration.end) === 'block')
    .map((decoration) => decoration.properties?.style)
  const btnStyle = classDecorations.find((decoration) => code.slice(decoration.start, decoration.end) === 'btn')?.properties?.style

  expect(blockStyles).toEqual([
    'color:var(--mcss-semantic-value);--shiki-dark:var(--mcss-semantic-value-dark)',
    'color:var(--mcss-semantic-value);--shiki-dark:var(--mcss-semantic-value-dark)'
  ])
  expect(btnStyle).toBe('color:var(--mcss-semantic-class);--shiki-dark:var(--mcss-semantic-class-dark);font-weight:600')
})

test.concurrent('applies semantic decorations in the Shiki tokens hook', () => {
  const code = '<div className="btn:hover@sm"></div>'
  const options = {
    lang: 'tsx',
    decorations: [
      { start: 0, end: 0, properties: { class: 'existing-decoration' } }
    ]
  }
  const transformer = transformerMasterCSS({
    manifest,
    classPrefix: 'master-css-token',
    dataAttributes: false,
    semanticTokenStyles: {
      'class.declaration': {
        'font-weight': '600'
      }
    }
  })

  const transformedTokens = transformer.tokens.call({ source: code, options }, [[{ content: code, offset: 0 }]])
  const semanticTokens = transformedTokens?.flat().filter((token) => token.htmlAttrs?.class)

  expect(options.decorations?.[0]?.properties?.class).toBe('existing-decoration')
  expect(options.decorations).toHaveLength(1)
  expect(semanticTokens).toEqual(expect.arrayContaining([
    expect.objectContaining({
      content: 'btn',
      htmlAttrs: {
        class: 'master-css-token master-css-token-class master-css-token-role-utility-component master-css-token-class-declaration master-css-token-class-component'
      },
      htmlStyle: {
        'font-weight': '600'
      }
    }),
    expect.objectContaining({
      content: 'hover',
      htmlAttrs: {
        class: 'master-css-token master-css-token-modifier master-css-token-role-selector-pseudoClass-name master-css-token-modifier-pseudoClass'
      },
      htmlStyle: {}
    })
  ]))
})

test.concurrent('uses semantic token scope styles for selector semantic tokens', () => {
  const code = '<div class="block>li:hover@md"></div>'
  const options = {
    lang: 'html'
  }
  const transformer = transformerMasterCSS({ manifest })
  const transformedTokens = transformer.tokens.call({
    source: code,
    options,
    codeToTokens: () => ({
      tokens: [semanticScopeStyleTokens()]
    })
  }, [[{ content: code, offset: 0, htmlStyle: { color: 'key' } }]])
  const tokens = transformedTokens?.flat().map((token) => ({
    content: token.content,
    htmlStyle: token.htmlStyle,
    className: token.htmlAttrs?.class
  }))

  expect(tokens).toEqual(expect.arrayContaining([
    {
      content: 'block',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
    },
    {
      content: '>',
      htmlStyle: { color: 'selector-operator' },
      className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-selector-combinator mcss-semantic-operator-selector'
    },
    {
      content: 'li',
      htmlStyle: { color: 'type' },
      className: 'mcss-semantic mcss-semantic-type mcss-semantic-role-selector-type mcss-semantic-type-selector'
    },
    {
      content: ':',
      htmlStyle: { color: 'modifier' },
      className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-selector-pseudoClass-delimiter mcss-semantic-operator-selector mcss-semantic-operator-pseudoClass'
    },
    {
      content: 'hover',
      htmlStyle: { color: 'modifier' },
      className: 'mcss-semantic mcss-semantic-modifier mcss-semantic-role-selector-pseudoClass-name mcss-semantic-modifier-pseudoClass'
    }
  ]))
})

test.concurrent('uses semantic token scope styles for documentation Master CSS tokens', () => {
  const htmlCode = '<section class="bg:blue block grid-cols:2@md fg:primary:hover"></section>'
  const htmlOptions = {
    lang: 'html'
  }
  const cssCode = [
    '@theme {',
    '  --color-primary: #4f46e5;',
    '  --spacing-card: 24;',
    '}',
    '@components {',
    '  card { @compose bg:blue fg:brand:hover; }',
    '}'
  ].join('\n')
  const cssOptions = {
    lang: 'css'
  }
  const transformer = transformerMasterCSS({ manifest })
  const syntaxTokens = semanticScopeStyleTokens()
  const htmlTransformedTokens = transformer.tokens.call({
    source: htmlCode,
    options: htmlOptions,
    codeToTokens: () => ({
      tokens: [syntaxTokens]
    })
  }, [[{ content: htmlCode, offset: 0, htmlStyle: { color: 'host' } }]])
  const cssTransformedTokens = transformer.tokens.call({
    source: cssCode,
    options: cssOptions,
    codeToTokens: () => ({
      tokens: [syntaxTokens]
    })
  }, [[{ content: cssCode, offset: 0, htmlStyle: { color: 'host' } }]])
  const htmlTokens = htmlTransformedTokens?.flat().map((token) => ({
    content: token.content,
    htmlStyle: token.htmlStyle,
    className: token.htmlAttrs?.class
  }))
  const cssTokens = cssTransformedTokens?.flat().map((token) => ({
    content: token.content,
    htmlStyle: token.htmlStyle,
    className: token.htmlAttrs?.class
  }))

  expect(htmlTokens).toEqual(expect.arrayContaining([
    {
      content: 'bg',
      htmlStyle: { color: 'property' },
      className: 'mcss-semantic mcss-semantic-property mcss-semantic-role-declaration-property'
    },
    {
      content: ':',
      htmlStyle: { color: 'operator' },
      className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-declaration-separator'
    },
    {
      content: 'blue',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-keyword'
    },
    {
      content: 'block',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
    },
    {
      content: '2',
      htmlStyle: { color: 'number' },
      className: 'mcss-semantic mcss-semantic-number mcss-semantic-role-value-number'
    },
    {
      content: '@md',
      htmlStyle: { color: 'keyword' },
      className: 'mcss-semantic mcss-semantic-keyword mcss-semantic-role-query-keyword mcss-semantic-keyword-query'
    },
    {
      content: 'hover',
      htmlStyle: { color: 'modifier' },
      className: 'mcss-semantic mcss-semantic-modifier mcss-semantic-role-selector-pseudoClass-name mcss-semantic-modifier-pseudoClass'
    }
  ]))
  expect(cssTokens).toEqual(expect.arrayContaining([
    {
      content: 'bg',
      htmlStyle: { color: 'property' },
      className: 'mcss-semantic mcss-semantic-property mcss-semantic-role-declaration-property'
    },
    {
      content: 'blue',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-keyword'
    },
    {
      content: 'brand',
      htmlStyle: { color: 'variable' },
      className: 'mcss-semantic mcss-semantic-variable mcss-semantic-role-value-variable'
    },
    {
      content: 'hover',
      htmlStyle: { color: 'modifier' },
      className: 'mcss-semantic mcss-semantic-modifier mcss-semantic-role-selector-pseudoClass-name mcss-semantic-modifier-pseudoClass'
    }
  ]))
  expect(cssTokens?.some((token) => token.content === '@theme' && token.className)).toBe(false)
  expect(cssTokens?.some((token) => token.content === '--color-primary' && token.className)).toBe(false)
})

test.concurrent('uses semantic token scope styles for CSS directive class-list tokens', () => {
  const code = [
    '@custom-variant motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }',
    '@components {',
    '    card {',
    '        @compose p:md r:xl;',
    '        @variant <sm {',
    '            @compose block;',
    '        }',
    '    }',
    '}'
  ].join('\n')
  const transformer = transformerMasterCSS()
  const transformedTokens = transformer.tokens.call({
    source: code,
    options: { lang: 'css' },
    codeToTokens: () => ({
      tokens: [semanticScopeStyleTokens()]
    })
  }, [[{ content: code, offset: 0, htmlStyle: { color: 'host' } }]])
  const tokens = transformedTokens?.flat().map((token) => ({
    content: token.content,
    htmlStyle: token.htmlStyle,
    className: token.htmlAttrs?.class
  }))

  expect(tokens).toEqual(expect.arrayContaining([
    {
      content: 'p',
      htmlStyle: { color: 'property' },
      className: 'mcss-semantic mcss-semantic-property mcss-semantic-role-declaration-property'
    },
    {
      content: 'md',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-keyword'
    },
    {
      content: 'r',
      htmlStyle: { color: 'property' },
      className: 'mcss-semantic mcss-semantic-property mcss-semantic-role-declaration-property'
    },
    {
      content: 'xl',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-keyword'
    },
    {
      content: 'block',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
    }
  ]))
  expect(tokens?.some((token) => token.content === '<' && token.className)).toBe(false)
  expect(tokens?.some((token) => token.content === 'sm' && token.className)).toBe(false)
})
