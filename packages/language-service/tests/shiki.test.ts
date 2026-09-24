import { expect, test } from 'vitest'
import { createHighlighter } from 'shiki'

import {
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
  variables: [{ namespace: 'color', key: 'brand', value: '#123456' }, { namespace: 'color', key: 'primary', value: '#4f46e5' }],
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

function expectTokensPreserveSource(tokens: ShikiContentToken[][], code: string) {
  expect(tokens.map((lineTokens) => lineTokens.map((token) => token.content).join(''))).toEqual(code.split('\n'))
}

function collectHastElements(node: any): any[] {
  const elements: any[] = []
  if (node?.type === 'element') elements.push(node)
  for (const child of node?.children ?? []) elements.push(...collectHastElements(child))
  return elements
}

function getHastClassNames(element: any): string[] {
  const className = element?.properties?.class
  if (Array.isArray(className)) {
    return className.flatMap((value) => typeof value === 'string' ? value.split(/\s+/) : [])
  }
  return typeof className === 'string' ? className.split(/\s+/).filter(Boolean) : []
}

function hasHastClass(element: any, className: string) {
  return getHastClassNames(element).includes(className)
}

function getHastText(node: any): string {
  if (node?.type === 'text') return node.value
  return (node?.children ?? []).map(getHastText).join('')
}

function collectHastElementsByClass(node: any, className: string) {
  return collectHastElements(node).filter((element) => hasHastClass(element, className))
}

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
  const code = '<div className="fg-brand:hover@sm block btn btn:hover@sm btn_div::before"></div>'
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
      text: 'fg-brand',
      type: 'enumMember',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-enumMember', 'mcss-semantic-role-utility-semantic'])
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

test('keeps v2 named classes whole in the colors guide example across both themes', async () => {
  const code = [
    '<main class="bg-surface-base text-body">',
    '  <section class="b:1px|solid|var(--color-line-base) surface-raised">',
    '    <h2 class="text-strong">Project updates</h2>',
    '    <p class="text-muted">Three milestones changed this week.</p>',
    '    <a class="text-link" href="#">Continue</a>',
    '  </section>',
    '</main>'
  ].join('\n')
  const highlighter = await createHighlighter({ themes: ['dracula', 'min-light'], langs: ['html'] })
  const options = { themes: { dark: 'dracula', light: 'min-light' }, defaultColor: false as const }

  try {
    const hast = highlighter.codeToHast(code, {
      ...options,
      lang: 'html',
      transformers: [transformerMasterCSS() as any]
    })
    const elements = collectHastElementsByClass(hast, 'mcss-semantic')
    const semantic = (text: string) => elements.filter((element) => getHastText(element) === text)
    for (const name of ['bg-surface-base', 'text-body', 'surface-raised', 'text-strong', 'text-muted', 'text-link']) {
      expect(semantic(name)).toHaveLength(1)
      expect(hasHastClass(semantic(name)[0], 'mcss-semantic-role-utility-semantic')).toBe(true)
    }
    expect(semantic('b')[0]?.properties?.['data-highlight-role']).toBe('declaration.property')
    expect(semantic(':')[0]?.properties?.['data-highlight-role']).toBe('declaration.separator')
    expect(semantic('px')[0]?.properties?.['data-highlight-role']).toBe('value.unit')
    expect(semantic('var')[0]?.properties?.['data-highlight-role']).toBe('value.function')
    expect(semantic('|').every((element) => element.properties?.['data-highlight-role'] === 'value.separator')).toBe(true)
    expect(collectHastElementsByClass(hast, 'line').map(getHastText)).toEqual(code.split('\n'))

    const blockHast = highlighter.codeToHast('block', {
      ...options,
      lang: 'plaintext',
      transformers: [transformerMasterCSS({ classList: true }) as any]
    })
    const block = collectHastElementsByClass(blockHast, 'mcss-semantic-role-utility-semantic')[0]
    for (const name of ['bg-surface-base', 'text-body']) {
      const style = semantic(name)[0]?.properties?.style as string
      for (const theme of ['--shiki-dark', '--shiki-light']) {
        expect(style).toContain(theme)
        expect(style.match(new RegExp(`${theme}:([^;]+)`))?.[1]).toBe((block.properties?.style as string).match(new RegExp(`${theme}:([^;]+)`))?.[1])
      }
    }
  } finally {
    await highlighter.dispose?.()
  }
})

test.concurrent('separates named opacity and native values without coloring unrelated text', () => {
  const samples = [
    { lang: 'html', code: '<!-- fg-red -->\n<div class="fg-red/0.5! block:hover@sm unknown-widget"></div>' },
    { lang: 'tsx', code: 'const label = "fg-blue";\n<div className="-m-sm fg-red/0.5" />' },
    { lang: 'css', code: '@components { card { @compose fg-red/0.5 b:1px|solid|var(--color-line-base) unknown-widget; } }' },
    { lang: 'mcss', code: 'fg-red/0.5 block:hover@sm color:red unknown-widget' }
  ]
  for (const { lang, code } of samples) {
    const tokens = createMasterCSSShikiDecorations(code, { lang })
      .map(({ start, end, role }) => ({ text: code.slice(start, end), role }))
    expect(tokens).toContainEqual({ text: 'fg-red', role: 'utility.semantic' })
    expect(tokens).toContainEqual({ text: '/', role: 'value.separator' })
    expect(tokens).toContainEqual({ text: '0.5', role: 'value.number' })
    expect(tokens.some(({ text }) => text === 'unknown-widget')).toBe(false)
    if (lang === 'html') {
      expect(tokens).toContainEqual({ text: '!', role: 'value.important' })
      expect(tokens).toContainEqual({ text: 'hover', role: 'selector.pseudoClass.name' })
      expect(tokens).toContainEqual({ text: '@sm', role: 'query.keyword' })
      expect(tokens.some(({ text }) => text === 'fg-red/0.5!' || text === 'fg-red -->')).toBe(false)
    }
    if (lang === 'tsx') {
      expect(tokens).toContainEqual({ text: '-m-sm', role: 'utility.semantic' })
      expect(tokens.some(({ text }) => text === 'fg-blue')).toBe(false)
    }
    if (lang === 'css') {
      expect(tokens).toContainEqual({ text: 'b', role: 'declaration.property' })
      expect(tokens).toContainEqual({ text: 'px', role: 'value.unit' })
    }
  }
})

test.concurrent('keeps UTF-16 offsets aligned after Unicode and raw escaped class text', () => {
  const code = '<div title="😀" class="fg-red\\:hover fg-blue"></div>'
  const decorations = createMasterCSSShikiDecorations(code, { lang: 'html' })
  const blue = decorations.find(({ start, end }) => code.slice(start, end) === 'fg-blue')

  expect(blue).toMatchObject({
    start: code.indexOf('fg-blue'),
    end: code.indexOf('fg-blue') + 'fg-blue'.length,
    role: 'utility.semantic'
  })
  expect(decorations.every(({ start, end }) => code.slice(start, end) !== '\\:')).toBe(true)
})

test.concurrent('assigns distinct highlight roles to native declaration value parts', () => {
  const code = 'content:"hello" w:calc(100%-1px) b:1px|solid|var(--color-line-base)'
  const tokens = createMasterCSSShikiDecorations(code, { lang: 'mcss' })
    .map(({ start, end, role }) => ({ text: code.slice(start, end), role }))

  for (const token of [
    { text: 'hello', role: 'value.string' },
    { text: 'calc', role: 'value.function' },
    { text: '(', role: 'value.function.punctuation' },
    { text: '-', role: 'value.operator' },
    { text: 'px', role: 'value.unit' },
    { text: '|', role: 'value.separator' },
    { text: 'solid', role: 'value.keyword' },
    { text: '--color-line-base', role: 'value.variable' }
  ] as const) {
    expect(tokens).toContainEqual(token)
  }
  expect(tokens.filter(({ text }) => text === 'hello' || text === 'calc' || text === '-' || text === 'px' || text === '|').every(({ role }) => role !== 'value.keyword')).toBe(true)
})

test.concurrent('creates Shiki decorations for CSS directive class-list spans', () => {
  const code = [
    '@safelist "block fg-red";',
    '@utilities {',
    '    text-<left|center|right> {',
    '        text-align: --value();',
    '    }',
    '',
    '    font-<~font-size> {',
    '        font-size: --value();',
    '    }',
    '',
    '    grid-cols:<number> {',
    '        grid-template-columns: repeat(--value(), minmax(0, 1fr));',
    '    }',
    '}',
    '@components {',
    '    btn {',
    '        @compose inline-flex fg-brand:hover@sm;',
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
      text: 'fg-red',
      type: 'enumMember',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic-role-utility-semantic'])
    }),
    expect.objectContaining({
      text: 'inline-flex',
      type: 'enumMember',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic-role-utility-semantic'])
    }),
    expect.objectContaining({
      text: 'fg-brand',
      type: 'enumMember',
      modifiers: [],
      classNames: expect.arrayContaining(['mcss-semantic-role-utility-semantic'])
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
  const code = 'fg-brand:hover@sm {bg-blue;fg-white}'
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
    { text: 'fg-brand', type: 'enumMember', modifiers: [] },
    { text: 'hover', type: 'modifier', modifiers: ['pseudoClass'] },
    { text: '@sm', type: 'keyword', modifiers: ['query'] },
    { text: '{', type: 'operator', modifiers: [] },
    { text: ';', type: 'operator', modifiers: [] },
    { text: '}', type: 'operator', modifiers: [] }
  ]))
})

test.concurrent('skips semantic token decorations inside host comments', () => {
  const code = '<!-- <div class="fg-red"></div> -->\n<div class="fg-blue"></div>'
  const decorations = createMasterCSSShikiDecorations(code, {
    lang: 'html'
  })
  const texts = decorations.map((decoration) => code.slice(decoration.start, decoration.end))

  expect(texts).toContain('fg-blue')
  expect(texts).not.toContain('fg-red')
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

test('wraps host class attribute values around Master CSS semantic spans', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['html']
  })
  const code = '<button class="text-amber" data-foo="bar">Save</button>'

  try {
    const originalHast = highlighter.codeToHast(code, {
      lang: 'html',
      theme: shikiSmokeTheme
    })
    const originalClassValueElement = collectHastElements(originalHast).find((element) => (
      element.tagName === 'span'
      && typeof element.properties?.style === 'string'
      && getHastText(element).includes('text-amber')
    ))
    const hast = highlighter.codeToHast(code, {
      lang: 'html',
      theme: shikiSmokeTheme,
      transformers: [transformerMasterCSS({ manifest }) as any]
    })
    const wrappers = collectHastElementsByClass(hast, 'mcss-host-role-class-attribute-value')
    const wrapper = wrappers[0]
    const wrapperChildren = collectHastElements(wrapper)

    expect(originalClassValueElement).toBeDefined()
    expect(wrappers).toHaveLength(1)
    expect(getHastText(wrapper)).toBe('text-amber')
    expect(hasHastClass(wrapper, 'mcss-host')).toBe(true)
    expect(wrapper.properties?.['data-master-css-host-role']).toBe('class-attribute-value')
    expect(wrapper.properties?.style).toBe(originalClassValueElement?.properties?.style)
    expect(wrapperChildren.some((element) => hasHastClass(element, 'mcss-semantic-role-utility-semantic'))).toBe(true)
    expect(collectHastElements(hast).filter((element) => getHastText(element) === 'bar' && hasHastClass(element, 'mcss-host'))).toHaveLength(0)
  } finally {
    await highlighter.dispose?.()
  }
})

test('can disable host class attribute value wrappers', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['html']
  })

  try {
    const hast = highlighter.codeToHast('<button class="text-amber">Save</button>', {
      lang: 'html',
      theme: shikiSmokeTheme,
      transformers: [transformerMasterCSS({
        classAttributeValueWrapper: false,
        manifest
      }) as any]
    })

    expect(collectHastElementsByClass(hast, 'mcss-host-role-class-attribute-value')).toHaveLength(0)
    expect(collectHastElementsByClass(hast, 'mcss-semantic-role-utility-semantic')).toHaveLength(1)
  } finally {
    await highlighter.dispose?.()
  }
})

test('wraps each visible line of multiline class values without changing code text', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['html', 'tsx']
  })

  try {
    for (const [lang, attribute] of [['html', 'class'], ['tsx', 'className']] as const) {
      for (const newline of ['\n', '\r\n']) {
        const code = `<div ${attribute}="fg-red${newline}  block"></div>`
        const hast = highlighter.codeToHast(code, {
          lang,
          theme: shikiSmokeTheme,
          transformers: [transformerMasterCSS({ manifest }) as any]
        })
        const wrappers = collectHastElementsByClass(hast, 'mcss-host-role-class-attribute-value')
        const lines = collectHastElementsByClass(hast, 'line')

        expect(lines.map(getHastText)).toEqual(code.split(/\r?\n/))
        expect(wrappers.map(getHastText)).toEqual(['fg-red', '  block'])
        expect(wrappers.every((wrapper) => wrapper.properties?.style)).toBe(true)
        expect(wrappers.every((wrapper) => wrapper.properties?.['data-master-css-host-role'] === 'class-attribute-value')).toBe(true)
        expect(collectHastElementsByClass(wrappers[0], 'mcss-semantic-role-utility-semantic')).toHaveLength(1)
        expect(collectHastElementsByClass(wrappers[1], 'mcss-semantic-role-utility-semantic')).toHaveLength(1)
      }
    }
  } finally {
    await highlighter.dispose?.()
  }
})

test('keeps caller decoration overlap behavior for multiline class values', async () => {
  const highlighter = await createHighlighter({ themes: [shikiSmokeTheme], langs: ['html'] })
  const code = '<div class="fg-red\n  block"></div>'

  try {
    const hast = highlighter.codeToHast(code, {
      lang: 'html',
      theme: shikiSmokeTheme,
      decorations: [{ start: 10, end: 18, properties: { class: 'caller-decoration' } }],
      transformers: [transformerMasterCSS({ manifest }) as any]
    } as any)

    expect(collectHastElementsByClass(hast, 'mcss-host-role-class-attribute-value')).toHaveLength(0)
    expect(collectHastElementsByClass(hast, 'caller-decoration')).toHaveLength(1)
  } finally {
    await highlighter.dispose?.()
  }
})

test('keeps host wrappers aligned when an earlier transformer removes source lines', async () => {
  const highlighter = await createHighlighter({ themes: [shikiSmokeTheme], langs: ['html'] })
  const code = '<!-- marker -->\n<div class="fg-red"></div>'

  try {
    const hast = highlighter.codeToHast(code, {
      lang: 'html',
      theme: shikiSmokeTheme,
      transformers: [
        { code(element) { element.children = element.children.slice(2) } },
        transformerMasterCSS({ manifest }) as any
      ]
    })

    expect(collectHastElementsByClass(hast, 'line').map(getHastText)).toEqual(['<div class="fg-red"></div>'])
    expect(collectHastElementsByClass(hast, 'mcss-host-role-class-attribute-value').map(getHastText)).toEqual(['fg-red'])
  } finally {
    await highlighter.dispose?.()
  }
})

test('matches native CSS string body and quote colors in both Shiki themes', async () => {
  const highlighter = await createHighlighter({
    themes: ['dracula', 'min-light'],
    langs: ['html', 'plaintext', 'css']
  })
  const options = { themes: { dark: 'dracula', light: 'min-light' }, defaultColor: false as const }
  const styleOf = (root: any, text: string, semantic = false) => {
    const element = collectHastElements(root).find((candidate) => (
      candidate.tagName === 'span'
      && getHastText(candidate) === text
      && typeof candidate.properties?.style === 'string'
      && (!semantic || candidate.properties?.['data-semantic-token-type'] === 'string')
    ))
    expect(element).toBeDefined()
    return Object.fromEntries((element.properties.style as string).split(';').map((part: string) => part.split(':')))
  }

  try {
    for (const [quote, lang, code] of [
      ["'", 'html', '<div class="content:\'hello\'"></div>'],
      ['"', 'plaintext', 'content:"hello"']
    ] as const) {
      const native = highlighter.codeToHast(`.x{content:${quote}hello${quote};}`, { ...options, lang: 'css' })
      const semantic = highlighter.codeToHast(code, {
        ...options,
        lang,
        transformers: [transformerMasterCSS({ manifest, classList: lang === 'plaintext' }) as any]
      })
      const nativeBody = styleOf(native, 'hello')
      const nativeQuote = styleOf(native, quote)
      const semanticBody = styleOf(semantic, 'hello', true)
      const semanticQuote = styleOf(semantic, quote, true)

      for (const theme of ['--shiki-light', '--shiki-dark']) {
        expect(semanticBody[theme]).toBe(nativeBody[theme])
        expect(semanticQuote[theme]).toBe(nativeQuote[theme])
      }
      expect(semanticBody['--shiki-dark']).not.toBe(semanticQuote['--shiki-dark'])
    }
  } finally {
    await highlighter.dispose?.()
  }
})

test('handles caller Shiki decorations around host class attribute value wrappers', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['html']
  })
  const code = '<button class="text-amber">Save</button>'

  try {
    const partialOverlapHast = highlighter.codeToHast(code, {
      lang: 'html',
      theme: shikiSmokeTheme,
      decorations: [
        { start: 10, end: 20, properties: { class: 'caller-decoration' } }
      ],
      transformers: [transformerMasterCSS({ manifest }) as any]
    } as any)
    expect(collectHastElementsByClass(partialOverlapHast, 'mcss-host-role-class-attribute-value')).toHaveLength(0)
    expect(collectHastElementsByClass(partialOverlapHast, 'caller-decoration')).toHaveLength(1)

    const containedHast = highlighter.codeToHast(code, {
      lang: 'html',
      theme: shikiSmokeTheme,
      decorations: [
        { start: 14, end: 26, properties: { class: 'caller-decoration' } }
      ],
      transformers: [transformerMasterCSS({ manifest }) as any]
    } as any)
    const wrappers = collectHastElementsByClass(containedHast, 'mcss-host-role-class-attribute-value')

    expect(wrappers).toHaveLength(1)
    expect(getHastText(wrappers[0])).toBe('text-amber')
    expect(collectHastElementsByClass(wrappers[0], 'caller-decoration')).toHaveLength(1)
  } finally {
    await highlighter.dispose?.()
  }
})

test.concurrent('does not create host wrappers for raw class-list highlighting', () => {
  const code = 'text-amber'
  const options = {
    lang: 'mcss',
    decorations: [] as any[]
  }
  const transformer = transformerMasterCSS({
    classList: true,
    manifest
  })

  transformer.tokens.call({ source: code, options }, [[{ content: code, offset: 0, color: 'value' }]])

  expect(options.decorations).toEqual([])
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
  const htmlCode = '<section class="bg-blue block grid-cols:2@md fg-primary:hover"></section>'
  const htmlOptions = {
    lang: 'html'
  }
  const cssCode = [
    '@theme {',
    '  --color-primary: #4f46e5;',
    '  --spacing-card: 24;',
    '}',
    '@components {',
    '  card { @compose bg-blue fg-brand:hover; }',
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
      content: 'bg-blue',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
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
      content: 'bg-blue',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
    },
    {
      content: 'fg-brand',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
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
    '        @compose p-md r-xl;',
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
      content: 'p-md',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
    },
    {
      content: 'r-xl',
      htmlStyle: { color: 'value' },
      className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
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
