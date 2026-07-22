import { describe, expect, test, vi } from 'vitest'
import UtilityType from '@master/css-schema/utility-type'
import { createCSSWithNativeDeclarations } from '@master/css-validator'
import {
  defaultCanonicalClassNameOptions,
  defaultClassLintSettings,
  createCanonicalComposeDirectiveReport,
  createCanonicalClassesReport,
  createClassListLintReport,
  createConflictingClassesReport,
  createInvalidClassesReport,
  createSortClassesReport,
  fixMasterCSSContent,
  findClassConflicts,
  findPartialClassConflicts,
  findUnapprovedRawValueClasses,
  getClassValidationIssues,
  lintMasterCSSContent,
  removeClassNamesFromClassList,
  replaceClassGroupInClassList,
  replaceClassNameInClassList,
  resolveMasterCSSLintRules,
  summarizeMasterCSSLintFiles,
  suggestCanonicalClassGroups,
  suggestCanonicalComposeDirective,
  sortClassList,
  sortClassNames,
  suggestCanonicalClassName,
  type MasterCSSLintDiagnostic
} from '../src'
import { createRustLintSession } from '../src/rust-session'
import { createPresetManifest } from './helpers/create-preset-manifest'

const css = createCSSWithNativeDeclarations(createPresetManifest())
const customManifest = createPresetManifest({
  settings: {
    rootSize: 16,
    modes: ['dark', 'midnight']
  },
  conditions: {
    tablet: {
      id: 'media',
      nodes: [{ type: 'number', value: 48, unit: 'rem' }]
    }
  },
  breakpointConditions: {
    tablet: {
      id: 'media',
      nodes: [{ type: 'number', value: 48, unit: 'rem' }]
    }
  },
  variables: [
    { namespace: 'breakpoint', key: 'tablet', name: 'breakpoint-tablet', type: 'number', value: '48rem', numeric: { value: 48, unit: 'rem' } },
    { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number', value: '1.25rem', numeric: { value: 1.25, unit: 'rem' } }
  ],
  variants: [
    { token: '@wide', branches: [{ conditions: ['@media (min-width: 80rem)'] }] }
  ],
  utilities: [
    {
      name: 'content-auto',
      type: UtilityType.Semantic,
      layer: 'utilities',
      declarations: { 'content-visibility': 'auto' }
    },
    {
      name: 'btn',
      type: UtilityType.Semantic,
      layer: 'components',
      declarations: { display: 'block' }
    }
  ]
})
const customCSS = createCSSWithNativeDeclarations(customManifest)

type PresetManifestInput = Parameters<typeof createPresetManifest>[0]
const registryFieldCSS = createCSSWithNativeDeclarations(createPresetManifest({
  variables: [
    { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number', value: '1.25rem', numeric: { value: 1.25, unit: 'rem' } }
  ],
  keyAliases: { space: 'margin' },
  nativeValueNamespaces: [{
    properties: ['--space'],
    variableAliasRefs: ['~spacing']
  }]
} as PresetManifestInput & {
  keyAliases: Record<string, string>
  nativeValueNamespaces: { properties: string[], variableAliasRefs: string[] }[]
}))

describe('class sorting', () => {
  test('matches the Rust sorting and conflict batch', async () => {
    const manifest = createPresetManifest()
    const rust = await createRustLintSession(manifest)
    const classNames = [
      'font:heavy',
      'bg:black:hover',
      'px:3x@sm',
      'rel',
      'grid-cols:2@md',
      'opacity:.8',
      'z:10',
      'fg:white',
      'hidden@<md',
      'text-center',
      'm:0',
      'flex',
      'p:4x',
      'unknown-app-class',
      'w:full',
      'r:lg',
      'bg:blue-60',
      'gap:2x',
      'overflow:hidden',
      'h:full',
      'transition:opacity|.2s',
      'b:1px|solid|gray-30',
      'block@dark',
      'align-items:center',
      'mt:2x',
      'box-shadow:0|2px|8px|#0003',
      'font:2.5rem@xs',
      '{content:``;block;h:full;w:full;abs}::after',
      'm:10px',
      'm:20px',
      'fg:black',
      'font:error',
      'display:block',
      'm:0'
    ]

    try {
      const batch = rust.analyze(classNames)
      expect(batch.version).toBe(1)
      expect(batch.sortedClassNames).toEqual(sortClassNames(classNames, css))
      expect(batch.conflicts).toEqual(findClassConflicts(classNames, css))
      expect(batch.partialConflicts).toEqual(findPartialClassConflicts(classNames, css))
    } finally {
      rust.dispose()
    }
  })

  test('sorts known classes and keeps unknown classes last', () => {
    expect(sortClassNames(['font:1.5rem', 'fg:white', 'm:2x', 'p:2x', 'bg:black'], css))
      .toEqual(['m:2x', 'p:2x', 'font:1.5rem', 'bg:black', 'fg:white'])
    expect(sortClassNames(['mt:0', 'hello:world', 'a', 'font:error'], css))
      .toEqual(['mt:0', 'a', 'font:error', 'hello:world'])
  })

  test('sorts generated classes into readable property groups', () => {
    const classNames = [
      'font:heavy',
      'bg:black:hover',
      'px:3x@sm',
      'rel',
      'grid-cols:2@md',
      'opacity:.8',
      'z:10',
      'fg:white',
      'hidden@<md',
      'text-center',
      'm:0',
      'flex',
      'p:4x',
      'unknown-app-class',
      'w:full',
      'r:lg',
      'bg:blue-60',
      'gap:2x',
      'overflow:hidden',
      'h:full',
      'transition:opacity|.2s',
      'b:1px|solid|gray-30',
      'block@dark',
      'align-items:center',
      'mt:2x',
      'box-shadow:0|2px|8px|#0003',
      'font:2.5rem@xs',
      '{content:``;block;h:full;w:full;abs}::after'
    ]

    expect(sortClassNames(classNames, css)).toEqual([
      'rel',
      'z:10',
      'flex',
      'overflow:hidden',
      'align-items:center',
      'gap:2x',
      'h:full',
      'w:full',
      'm:0',
      'mt:2x',
      'p:4x',
      'b:1px|solid|gray-30',
      'r:lg',
      'font:heavy',
      'text-center',
      'bg:blue-60',
      'fg:white',
      'opacity:.8',
      'box-shadow:0|2px|8px|#0003',
      'transition:opacity|.2s',
      '{content:``;block;h:full;w:full;abs}::after',
      'bg:black:hover',
      'block@dark',
      'font:2.5rem@xs',
      'px:3x@sm',
      'grid-cols:2@md',
      'hidden@<md',
      'unknown-app-class'
    ])
  })

  test('deduplicates repeated classes', () => {
    expect(sortClassNames(['w:3x', 'w:0.375rem@lg', 'w:3x'], css))
      .toEqual(['w:3x', 'w:0.375rem@lg'])
  })

  test('generates each unique class once while sorting', () => {
    const generate = vi.fn((className: string) => css.generate(className))
    const cssWithGenerateSpy = { generate } as unknown as typeof css

    expect(sortClassNames(['w:3x', 'w:0.375rem@lg', 'w:3x'], cssWithGenerateSpy))
      .toEqual(['w:3x', 'w:0.375rem@lg'])
    expect(generate).toHaveBeenCalledTimes(2)
  })
})

describe('class list edits', () => {
  test('matches Rust UTF-16 edit plans while preserving raw whitespace', async () => {
    const rust = await createRustLintSession(createPresetManifest())
    const toRustDiagnostic = ({ severity: _, fix, ...diagnostic }: MasterCSSLintDiagnostic) => ({
      ...diagnostic,
      fix: fix && { range: fix.range, text: fix.text }
    })
    try {
      const sorted = rust.analyzeClassList(
        'fg:white  m:2x\tfg:white',
        ['fg:white', 'm:2x', 'fg:white']
      )
      expect(sorted.sortEdit?.text).toBe(sortClassList('fg:white  m:2x\tfg:white', css))
      const sortedOracle = createSortClassesReport('fg:white  m:2x\tfg:white', css).diagnostics[0]
      expect(sorted.diagnostics[0]).toEqual(sortedOracle && toRustDiagnostic(sortedOracle))

      const full = rust.analyzeClassList(
        '😀 m:10px  m:20px m:30px',
        ['😀', 'm:10px', 'm:20px', 'm:30px']
      )
      const fullOracle = createConflictingClassesReport('😀 m:10px  m:20px m:30px', css).diagnostics[0]
      expect(full.conflictRange).toEqual(fullOracle?.range)
      expect(full.conflictEdit).toEqual(fullOracle?.fix && {
        range: fullOracle.fix.range,
        text: fullOracle.fix.text
      })
      expect(full.diagnostics.find(({ ruleId }) => ruleId === 'no-conflicting-classes'))
        .toEqual(fullOracle && toRustDiagnostic(fullOracle))

      const partial = rust.analyzeClassList('mx:md ml:lg', ['mx:md', 'ml:lg'])
      const partialOracle = createConflictingClassesReport('mx:md ml:lg', css).diagnostics[0]
      expect(partial.conflictRange).toEqual(partialOracle?.range)
      expect(partial.conflictEdit).toEqual(partialOracle?.fix && {
        range: partialOracle.fix.range,
        text: partialOracle.fix.text
      })
      expect(partial.diagnostics.find(({ ruleId }) => ruleId === 'no-conflicting-classes'))
        .toEqual(partialOracle && toRustDiagnostic(partialOracle))

      const invalid = rust.analyzeClassList(
        'text-decoration:bad()',
        ['text-decoration:bad()']
      )
      const invalidOracle = createInvalidClassesReport('text-decoration:bad()', css).diagnostics[0]
      expect(invalid.diagnostics.find(({ ruleId }) => ruleId === 'no-invalid-classes'))
        .toEqual(invalidOracle && toRustDiagnostic(invalidOracle))

      const unknown = rust.analyzeClassList('unknown-class', ['unknown-class'], {
        disallowUnknownClass: true
      })
      const unknownOracle = createInvalidClassesReport('unknown-class', css, {
        disallowUnknownClass: true
      }).diagnostics[0]
      expect(unknown.diagnostics.find(({ ruleId }) => ruleId === 'no-invalid-classes'))
        .toEqual(unknownOracle && toRustDiagnostic(unknownOracle))

      expect(rust.analyzeClassList(
        'content:\\`\\` block',
        ['content:``', 'block']
      ).sortEdit?.text).toBe(sortClassList('content:\\`\\` block', css, { unescape: '`' }))
    } finally {
      rust.dispose()
    }
  })

  test('sorts class-list text while preserving useful whitespace and raw tokens', () => {
    expect(sortClassList('fg:white  m:2x\tfg:white', css))
      .toBe('m:2x  fg:white')
    expect(sortClassList('fg:white\nm:2x\nfg:white', css))
      .toBe('m:2x\nfg:white')
    expect(sortClassList('content:\\`\\` block', css, { unescape: '`' }))
      .toBe('block content:\\`\\`')
  })

  test('removes and replaces class-list tokens with adjacent whitespace', () => {
    expect(removeClassNamesFromClassList('a  b\tc', ['b']))
      .toBe('a\tc')
    expect(removeClassNamesFromClassList('a  a\tb', ['a']))
      .toBe('a\tb')
    expect(removeClassNamesFromClassList('a  a\tb', ['a', 'a']))
      .toBe('b')
    expect(removeClassNamesFromClassList('a\n  b\n  c', ['b']))
      .toBe('a\n  c')
    expect(replaceClassNameInClassList('content:\\\'\\\' block', 'content:\'\'', 'content:""', { unescape: '\'' }))
      .toBe('content:"" block')
    expect(replaceClassNameInClassList('content:\\`\\` block', 'content:``', 'content:none', { unescape: '`' }))
      .toBe('content:none block')
    expect(replaceClassNameInClassList('m:md block', 'm:md', 'mx:md mb:md'))
      .toBe('mx:md mb:md block')
    expect(replaceClassNameInClassList('a a b', 'a', 'c'))
      .toBe('c a b')
  })

  test('replaces grouped class-list tokens', () => {
    expect(replaceClassGroupInClassList('w:md h:md fg:red-60', ['w:md', 'h:md'], 'size:md'))
      .toBe('size:md fg:red-60')
    expect(replaceClassGroupInClassList('w:md\n  h:md\n  fg:red-60', ['w:md', 'h:md'], 'size:md'))
      .toBe('size:md\n  fg:red-60')
    expect(replaceClassGroupInClassList('w:md h:md w:md', ['w:md', 'h:md'], 'size:md'))
      .toBe('size:md w:md')
    expect(replaceClassGroupInClassList('h:md fg:red-60', ['w:md', 'h:md'], 'size:md'))
      .toBe('h:md fg:red-60')
    expect(replaceClassGroupInClassList('content:\\`\\` block', ['content:``', 'block'], 'content:none', { unescape: '`' }))
      .toBe('content:none')
  })
})

describe('lint diagnostics', () => {
  test('reports sort diagnostics with a machine-readable fix', () => {
    expect(createSortClassesReport('fg:white m:2x', css)).toEqual({
      diagnostics: [{
        ruleId: 'sort-classes',
        code: 'invalid-class-order',
        message: 'Sort classes into the expected order: "m:2x fg:white".',
        severity: 'warning',
        range: { start: 0, end: 13 },
        data: {
          actual: 'fg:white m:2x',
          expected: 'm:2x fg:white'
        },
        fix: {
          range: { start: 0, end: 13 },
          text: 'm:2x fg:white',
          scope: 'class-list'
        }
      }]
    })
  })

  test('reports conflict diagnostics with token-relative ranges', () => {
    expect(createConflictingClassesReport('m:10px m:20px m:30px', css).diagnostics[0]?.message)
      .toBe('Remove classes "m:10px m:20px"; they are overridden by later class "m:30px".')

    const report = createConflictingClassesReport('mx:md ml:lg', css)
    expect(report.diagnostics).toEqual([expect.objectContaining({
      ruleId: 'no-conflicting-classes',
      code: 'partially-conflicting-class',
      message: 'Replace "mx:md" with "mr:md"; later class "ml:lg" overrides part of "mx:md".',
      severity: 'warning',
      range: { start: 0, end: 5 },
      data: {
        actual: 'mx:md',
        replacement: 'mr:md',
        conflict: 'ml:lg'
      },
      fix: {
        range: { start: 0, end: 11 },
        text: 'mr:md ml:lg',
        scope: 'class-list'
      }
    })])
    expect(JSON.parse(JSON.stringify(report))).toEqual(report)
  })

  test('reports invalid generated CSS diagnostics with class context', () => {
    expect(createInvalidClassesReport('text-decoration:bad()', css).diagnostics[0]?.message)
      .toBe('Class "text-decoration:bad()" emits invalid CSS: Invalid value for `text-decoration-color` property.')
  })

  test('reports canonical diagnostics with explicit replacements', () => {
    expect(createCanonicalClassesReport('font:16px w:md h:md', css).diagnostics.map(({ message }) => message))
      .toEqual([
        'Use canonical class "size:md" instead of "w:md h:md".',
        'Use canonical class "font:md" instead of "font:16px".'
      ])
  })

  test('keeps raw value policy opt-in in combined reports', () => {
    expect(createClassListLintReport('font:15px', css).diagnostics.map(({ code }) => code))
      .not.toContain('unapproved-raw-value')
    expect(createClassListLintReport('font:15px', css, {
      rules: { 'no-unapproved-raw-values': true }
    }).diagnostics.map(({ code }) => code))
      .toContain('unapproved-raw-value')
  })

  test('reports structural compose fixes with directive scope', () => {
    const report = createCanonicalComposeDirectiveReport('contain:content bg:blue-60:hover@sm', css)
    expect(report.diagnostics).toContainEqual(expect.objectContaining({
      ruleId: 'prefer-canonical-classes',
      code: 'prefer-native-declaration',
      data: expect.objectContaining({
        actual: 'contain:content',
        recommended: 'contain: content'
      }),
      fix: expect.objectContaining({
        scope: 'directive',
        text: expect.stringContaining('contain: content;')
      })
    }))
    expect(report.diagnostics).toContainEqual(expect.objectContaining({
      code: 'prefer-native-declaration',
      message: 'Use CSS declaration `contain: content` instead of class "contain:content".'
    }))
    expect(report.diagnostics).toContainEqual(expect.objectContaining({
      code: 'prefer-variant-block',
      message: 'Move class "bg:blue-60:hover@sm" into the canonical @compose block.'
    }))
  })
})

describe('source content linting', () => {
  test('resolves rule presets and explicit rule sets', () => {
    expect(resolveMasterCSSLintRules('no-invalid-classes')).toEqual({
      'sort-classes': false,
      'no-invalid-classes': true,
      'no-conflicting-classes': false,
      'prefer-canonical-classes': false,
      'no-unapproved-raw-values': false
    })
    expect(resolveMasterCSSLintRules('recommended')).toEqual({
      'sort-classes': true,
      'no-invalid-classes': true,
      'no-conflicting-classes': true,
      'prefer-canonical-classes': true,
      'no-unapproved-raw-values': false
    })
    expect(() => resolveMasterCSSLintRules('unknown-rule')).toThrow('Unknown Master CSS lint rule')
  })

  test('maps class diagnostics and safe fixes onto source ranges', () => {
    const result = lintMasterCSSContent({
      content: '<div class="fg:white m:2x"></div>',
      filePath: '/project/index.html',
      css
    })

    expect(result.languageId).toBe('html')
    expect(result.sourceKind).toBe('source')
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'invalid-class-order',
      sourceKind: 'class-attribute',
      loc: {
        start: { line: 1, column: 13 },
        end: { line: 1, column: 26 }
      },
      fixes: [expect.objectContaining({
        kind: 'class-list',
        safety: 'safe',
        text: 'm:2x fg:white'
      })]
    }))
    expect(fixMasterCSSContent({
      content: '<div class="fg:white m:2x"></div>',
      filePath: '/project/index.html',
      css
    })).toBe('<div class="m:xs fg:white"></div>')
    expect(summarizeMasterCSSLintFiles([result])).toMatchObject({
      files: 1,
      warnings: result.diagnostics.length,
      safeFixes: expect.any(Number)
    })
  })

  test('routes source core diagnostics through an injected Rust session', async () => {
    const rust = await createRustLintSession(createPresetManifest())
    let analyzeCalls = 0
    const lintSession = {
      analyzeClassList(...args: Parameters<typeof rust.analyzeClassList>) {
        analyzeCalls++
        return rust.analyzeClassList(...args)
      }
    }
    try {
      const result = lintMasterCSSContent({
        content: '<div class="text-decoration:bad() m:2x m:3x unknown"></div>',
        filePath: '/project/index.html',
        css,
        lintSession,
        rules: {
          'prefer-canonical-classes': false,
          'no-unapproved-raw-values': false
        },
        ruleOptions: {
          'no-invalid-classes': { disallowUnknownClass: true }
        }
      })
      expect(analyzeCalls).toBe(1)
      expect(result.diagnostics.map(({ code }) => code)).toEqual([
        'invalid-class-order',
        'invalid-class',
        'unknown-class',
        'conflicting-class'
      ])
    } finally {
      rust.dispose()
    }
  })

  test('lints and fixes class lists inside mdx fenced html examples', () => {
    const content = [
      '```html',
      '<button class="inline-flex align-items:center gap:2x px:md py:xs r:md fg:white bg:blue-60">',
      '    Save',
      '</button>',
      '```'
    ].join('\n')
    const result = lintMasterCSSContent({
      content,
      filePath: '/project/content.mdx',
      css
    })

    expect(result).toMatchObject({
      languageId: 'mdx',
      sourceKind: 'source'
    })
    expect(result.diagnostics.map((diagnostic) => diagnostic.ruleId)).toEqual([
      'sort-classes',
      'prefer-canonical-classes',
      'prefer-canonical-classes'
    ])
    expect(fixMasterCSSContent({
      content,
      filePath: '/project/content.mdx',
      css
    })).toBe([
      '```html',
      '<button class="inline-flex items-center gap:xs px:md py:xs r:md bg:blue-60 fg:white">',
      '    Save',
      '</button>',
      '```'
    ].join('\n'))
  })

  test('passes rule options to source content diagnostics', () => {
    const content = [
      '```html',
      '<div class="btn font:15px w:17px"></div>',
      '```'
    ].join('\n')
    const result = lintMasterCSSContent({
      content,
      filePath: '/project/content.mdx',
      css,
      rules: {
        'sort-classes': false,
        'no-conflicting-classes': false,
        'prefer-canonical-classes': false,
        'no-invalid-classes': true,
        'no-unapproved-raw-values': true
      },
      ruleOptions: {
        'no-invalid-classes': {
          disallowUnknownClass: true
        },
        'no-unapproved-raw-values': {
          allowProperties: ['width']
        }
      }
    })

    expect(result.diagnostics.map((diagnostic) => ({
      ruleId: diagnostic.ruleId,
      code: diagnostic.code,
      message: diagnostic.message
    }))).toEqual([
      {
        ruleId: 'no-invalid-classes',
        code: 'unknown-class',
        message: 'Unknown Master CSS class "btn". It is not generated by the active manifest.'
      },
      {
        ruleId: 'no-unapproved-raw-values',
        code: 'unapproved-raw-value',
        message: 'Raw value "15px" is not approved for class "font:15px". Use a token or allow the value explicitly.'
      }
    ])
  })

  test('applies source fixes until class lists are stable', () => {
    expect(fixMasterCSSContent({
      content: '<div class="size:md w:md h:md block"></div>',
      filePath: '/project/index.html',
      css
    })).toBe('<div class="block size:md"></div>')
  })

  test('uses script language ids for cjs and typescript module files', () => {
    expect(lintMasterCSSContent({
      content: 'const cls = "fg:white m:2x"',
      filePath: '/project/component.cjs',
      css
    })).toMatchObject({
      languageId: 'javascript'
    })
    expect(lintMasterCSSContent({
      content: 'const cls = "fg:white m:2x"',
      filePath: '/project/component.mts',
      css
    })).toMatchObject({
      languageId: 'typescript'
    })
  })

  test('reports and applies structural compose directive fixes when allowed', () => {
    const content = '.btn { @compose contain:content; }'
    const result = lintMasterCSSContent({
      content,
      filePath: '/project/index.css',
      css
    })

    expect(result.sourceKind).toBe('stylesheet')
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'prefer-native-declaration',
      sourceKind: 'compose-directive',
      fixes: [expect.objectContaining({ kind: 'directive', safety: 'structural' })]
    }))
    expect(fixMasterCSSContent({
      content,
      filePath: '/project/index.css',
      css
    })).toBe(content)
    expect(fixMasterCSSContent({
      content,
      filePath: '/project/index.css',
      css,
      includeDirectiveFixes: true
    })).toBe('.btn { contain: content; }')
  })
})

describe('class conflicts', () => {
  test('finds classes with matching declarations and variants', () => {
    expect(findClassConflicts(['m:10px', 'm:20px', 'm:30px:hover', 'm:40px@dark'], css))
      .toEqual([
        { className: 'm:10px', conflicts: ['m:20px'] }
      ])
  })

  test('ignores invalid classes', () => {
    expect(findClassConflicts(['a', 'hello:world', 'm:10px', 'm:20px'], css))
      .toEqual([
        { className: 'm:10px', conflicts: ['m:20px'] }
      ])
  })

  test('keeps the last conflicting class', () => {
    expect(findClassConflicts(['m:sm', 'm:md', 'm:lg'], css))
      .toEqual([
        { className: 'm:sm', conflicts: ['m:lg'] },
        { className: 'm:md', conflicts: ['m:lg'] }
      ])
  })
})

describe('partial class conflicts', () => {
  test('matches the Rust partial conflict batch', async () => {
    const manifest = createPresetManifest()
    const rust = await createRustLintSession(manifest)
    const cases = [
      ['mx:md', 'ml:lg'],
      ['mx:md', 'mr:lg'],
      ['p:md', 'px:lg'],
      ['p:md', 'py:lg'],
      ['m:md', 'mt:lg'],
      ['p:md', 'pl:lg'],
      ['inset:md', 'top:lg'],
      ['inset:md@sm', 'top:lg@sm'],
      ['r:md', 'rtl:lg'],
      ['r:md', 'rbr:lg'],
      ['border-radius:.375rem', 'border-top-left-radius:.5rem'],
      ['b:1px', 'bt:2px'],
      ['b:0', 'bl:1px'],
      ['border-width:1px', 'border-top-width:2px'],
      ['b:red-60', 'bt:blue-60'],
      ['border-color:red-60', 'border-left-color:blue-60'],
      ['b-solid', 'bt-dashed'],
      ['border-style:solid', 'border-bottom-style:dotted'],
      ['mx:md', 'ml:lg@sm'],
      ['mx:md', 'mx:lg'],
      ['b:1px', 'bx:2px'],
      ['r:md|lg', 'rtl:xl'],
      ['unknown-class', 'btn']
    ]

    try {
      for (const classNames of cases) {
        expect(rust.analyze(classNames).partialConflicts, classNames.join(' '))
          .toEqual(findPartialClassConflicts(classNames, css))
      }
    } finally {
      rust.dispose()
    }
  })

  test('splits margin axis classes when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['mx:md', 'ml:lg'], css)).toEqual([
      { className: 'mx:md', replacement: 'mr:md', conflict: 'ml:lg' }
    ])
    expect(findPartialClassConflicts(['mx:md', 'mr:lg'], css)).toEqual([
      { className: 'mx:md', replacement: 'ml:md', conflict: 'mr:lg' }
    ])
  })

  test('splits padding shorthand classes when a later axis overrides part of them', () => {
    expect(findPartialClassConflicts(['p:md', 'px:lg'], css)).toEqual([
      { className: 'p:md', replacement: 'py:md', conflict: 'px:lg' }
    ])
    expect(findPartialClassConflicts(['p:md', 'py:lg'], css)).toEqual([
      { className: 'p:md', replacement: 'px:md', conflict: 'py:lg' }
    ])
  })

  test('splits shorthand classes when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['m:md', 'mt:lg'], css)).toEqual([
      { className: 'm:md', replacement: 'mx:md mb:md', conflict: 'mt:lg' }
    ])
    expect(findPartialClassConflicts(['p:md', 'pl:lg'], css)).toEqual([
      { className: 'p:md', replacement: 'py:md pr:md', conflict: 'pl:lg' }
    ])
  })

  test('ignores different variants and fully overridden classes', () => {
    expect(findPartialClassConflicts(['mx:md', 'ml:lg@sm'], css)).toEqual([])
    expect(findPartialClassConflicts(['mx:md', 'mx:lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['mx:md', 'm:lg'], css)).toEqual([])
  })

  test('splits physical inset shorthands when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['inset:md', 'top:lg'], css)).toEqual([
      { className: 'inset:md', replacement: 'right:md bottom:md left:md', conflict: 'top:lg' }
    ])
    expect(findPartialClassConflicts(['inset:md', 'left:lg'], css)).toEqual([
      { className: 'inset:md', replacement: 'top:md right:md bottom:md', conflict: 'left:lg' }
    ])
    expect(findPartialClassConflicts(['inset:md@sm', 'top:lg@sm'], css)).toEqual([
      { className: 'inset:md@sm', replacement: 'right:md@sm bottom:md@sm left:md@sm', conflict: 'top:lg@sm' }
    ])
  })

  test('splits radius shorthands when a later corner overrides part of them', () => {
    expect(findPartialClassConflicts(['r:md', 'rtl:lg'], css)).toEqual([
      { className: 'r:md', replacement: 'rtr:md rbr:md rbl:md', conflict: 'rtl:lg' }
    ])
    expect(findPartialClassConflicts(['r:md', 'rbr:lg'], css)).toEqual([
      { className: 'r:md', replacement: 'rtl:md rtr:md rbl:md', conflict: 'rbr:lg' }
    ])
    expect(findPartialClassConflicts(['border-radius:.375rem', 'border-top-left-radius:.5rem'], css)).toEqual([
      { className: 'border-radius:.375rem', replacement: 'rtr:md rbr:md rbl:md', conflict: 'border-top-left-radius:.5rem' }
    ])
  })

  test('splits border width shorthands when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['b:1px', 'bt:2px'], css)).toEqual([
      { className: 'b:1px', replacement: 'br:1px bb:1px bl:1px', conflict: 'bt:2px' }
    ])
    expect(findPartialClassConflicts(['b:0', 'bl:1px'], css)).toEqual([
      { className: 'b:0', replacement: 'bt:0 br:0 bb:0', conflict: 'bl:1px' }
    ])
    expect(findPartialClassConflicts(['border-width:1px', 'border-top-width:2px'], css)).toEqual([
      { className: 'border-width:1px', replacement: 'br:1px bb:1px bl:1px', conflict: 'border-top-width:2px' }
    ])
  })

  test('splits border color shorthands when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['b:red-60', 'bt:blue-60'], css)).toEqual([
      { className: 'b:red-60', replacement: 'br:red-60 bb:red-60 bl:red-60', conflict: 'bt:blue-60' }
    ])
    expect(findPartialClassConflicts(['border-color:red-60', 'border-left-color:blue-60'], css)).toEqual([
      { className: 'border-color:red-60', replacement: 'bt:red-60 br:red-60 bb:red-60', conflict: 'border-left-color:blue-60' }
    ])
  })

  test('splits border style shorthands when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['b-solid', 'bt-dashed'], css)).toEqual([
      { className: 'b-solid', replacement: 'br-solid bb-solid bl-solid', conflict: 'bt-dashed' }
    ])
    expect(findPartialClassConflicts(['border-style:solid', 'border-bottom-style:dotted'], css)).toEqual([
      { className: 'border-style:solid', replacement: 'bt-solid br-solid bl-solid', conflict: 'border-bottom-style:dotted' }
    ])
  })

  test('ignores unsupported partial conflict families', () => {
    expect(findPartialClassConflicts(['b:1px', 'bt:2px@sm'], css)).toEqual([])
    expect(findPartialClassConflicts(['b:1px', 'b:2px'], css)).toEqual([])
    expect(findPartialClassConflicts(['b:1px', 'bx:2px'], css)).toEqual([])
    expect(findPartialClassConflicts(['ix:md', 'ixs:lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['r:md|lg', 'rtl:xl'], css)).toEqual([])
    expect(findPartialClassConflicts(['unknown-class', 'btn'], css)).toEqual([])
  })
})

describe('class validation issues', () => {
  test('reports invalid generated CSS', () => {
    expect(getClassValidationIssues('text-decoration:bad()', css)).toMatchObject([
      { kind: 'invalid', className: 'text-decoration:bad()' }
    ])
  })

  test('reports unknown classes only when requested', () => {
    expect(getClassValidationIssues('unknown-class', css)).toEqual([])
    expect(getClassValidationIssues('unknown-class', css, { disallowUnknownClass: true })).toEqual([
      {
        kind: 'unknown',
        className: 'unknown-class',
        message: 'Unknown Master CSS class "unknown-class". It is not generated by the active manifest.'
      }
    ])
    expect(getClassValidationIssues('unknown-class', css, { disallowUnknownClass: true, displayClassName: 'raw-class' })[0]?.message)
      .toBe('Unknown Master CSS class "raw-class". It is not generated by the active manifest.')
  })

  test('escapes quoted class names in diagnostic messages', () => {
    expect(getClassValidationIssues('unknown:"value"', css, { disallowUnknownClass: true })[0]?.message)
      .toBe('Unknown Master CSS class "unknown:\\"value\\"". It is not generated by the active manifest.')
    expect(createInvalidClassesReport('unknown:\\\"value\\\"', css, { disallowUnknownClass: true, unescape: '"' }).diagnostics[0]?.message)
      .toBe('Unknown Master CSS class "unknown:\\"value\\"". It is not generated by the active manifest.')
  })
})

describe('raw value policy', () => {
  test('reports raw values in token-backed utilities', () => {
    expect(findUnapprovedRawValueClasses(['font:15px', 'm:17px', 'fg:#123456'], css)).toEqual([
      { className: 'font:15px', key: 'font', value: '15px', properties: ['font-size'] },
      { className: 'm:17px', key: 'm', value: '17px', properties: ['margin'] },
      { className: 'fg:#123456', key: 'fg', value: '#123456', properties: ['color'] }
    ])
  })

  test('ignores token, static, invalid, unknown, and component classes', () => {
    const componentCSS = createCSSWithNativeDeclarations(createPresetManifest({
      utilities: [
        {
          name: 'btn',
          type: UtilityType.Semantic,
          layer: 'components',
          declarations: { display: 'block' }
        }
      ]
    }))
    expect(findUnapprovedRawValueClasses([
      'font:md',
      'm:md',
      'm:md|lg',
      'fg:red-60',
      'text-center',
      'font:error',
      'unknown-class',
      'btn'
    ], componentCSS)).toEqual([])
  })

  test('allows raw values by property, key, pattern, or full opt-out', () => {
    expect(findUnapprovedRawValueClasses(['w:50%'], css, { allowProperties: ['width'] })).toEqual([])
    expect(findUnapprovedRawValueClasses(['w:50%'], css, { allowProperties: ['w'] })).toEqual([])
    expect(findUnapprovedRawValueClasses(['m:calc(1rem+1px)'], css, { allowedPatterns: ['^calc\\('] })).toEqual([])
    expect(findUnapprovedRawValueClasses(['font:15px'], css, { allowRawValues: true })).toEqual([])
  })

  test('applies raw value allowed patterns to individual multi-value segments', () => {
    expect(findUnapprovedRawValueClasses(['m:md|calc(1rem+1px)', 'm:calc(1rem+1px)|md'], css, {
      allowedPatterns: ['^calc\\(']
    })).toEqual([])
    expect(findUnapprovedRawValueClasses(['m:md|17px', 'm:calc(1rem+1px)|18px', 'm:19px|20px'], css, {
      allowedPatterns: ['^calc\\(']
    })).toEqual([
      { className: 'm:md|17px', key: 'm', value: '17px', properties: ['margin'] },
      { className: 'm:calc(1rem+1px)|18px', key: 'm', value: '18px', properties: ['margin'] },
      { className: 'm:19px|20px', key: 'm', value: '19px|20px', properties: ['margin'] }
    ])
  })

  test('uses active manifest tokens without treating registry fields as token namespaces', () => {
    expect(findUnapprovedRawValueClasses(['m:card', 'm:17px'], customCSS)).toEqual([
      { className: 'm:17px', key: 'm', value: '17px', properties: ['margin'] }
    ])
    expect(findUnapprovedRawValueClasses(['--space:17px'], registryFieldCSS)).toEqual([])
  })
})

describe('canonical class suggestions', () => {
  test('suggests static utilities, theme tokens, and property aliases', () => {
    expect(suggestCanonicalClassName('text-align:center:hover@sm', css)).toBe('text-center:hover@sm')
    expect(suggestCanonicalClassName('font:16px', css)).toBe('font:md')
    expect(suggestCanonicalClassName('margin:md', css)).toBe('m:md')
  })

  test('suggests static utility aliases from generated declarations', () => {
    expect(suggestCanonicalClassName('position:relative', css)).toBe('rel')
    expect(suggestCanonicalClassName('display:none', css)).toBe('hidden')
    expect(suggestCanonicalClassName('visibility:hidden', css)).toBe('invisible')
    expect(suggestCanonicalClassName('height:100vh', css)).toBe('vh')
    expect(suggestCanonicalClassName('width:100vw', css)).toBe('vw')
    expect(suggestCanonicalClassName('aspect-ratio:1/1', css)).toBe('square')
  })

  test('suggests multi-value theme tokens', () => {
    expect(suggestCanonicalClassName('m:1rem|1.5rem', css)).toBe('m:md|lg')
    expect(suggestCanonicalClassName('p:.5rem|1rem', css)).toBe('p:xs|md')
    expect(suggestCanonicalClassName('r:.25rem|.375rem', css)).toBe('r:sm|md')
  })

  test('suggests theme tokens from CSS variable references', () => {
    expect(suggestCanonicalClassName('m:var(--spacing-md)', css)).toBe('m:md')
    expect(suggestCanonicalClassName('r:var(--radius-md)', css)).toBe('r:md')
    expect(suggestCanonicalClassName('fg:var(--color-red-60)', css)).toBe('fg:red-60')
  })

  test('suggests canonical condition suffix order', () => {
    expect(suggestCanonicalClassName('block@dark@sm', css)).toBe('block@sm@dark')
    expect(suggestCanonicalClassName('block:hover@dark@sm', css)).toBe('block:hover@sm@dark')
    expect(suggestCanonicalClassName('block!@dark@sm', css)).toBe('block!@sm@dark')
    expect(suggestCanonicalClassName('font:16px@dark@sm', css)).toBe('font:md@sm@dark')
    expect(suggestCanonicalClassName('text-align:center@dark@sm', css)).toBe('text-center@sm@dark')
  })

  test('combines condition order independently with canonical suggestion options', () => {
    expect(suggestCanonicalClassName('font:16px@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferConditionOrder: false
    })).toBe('font:md@dark@sm')
    expect(suggestCanonicalClassName('font:16px@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferThemeTokens: false
    })).toBe('font:16px@sm@dark')
    expect(suggestCanonicalClassName('font:16px@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferConditionOrder: false,
      preferThemeTokens: false
    })).toBeUndefined()
    expect(suggestCanonicalClassName('margin:md@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferPropertyAliases: false
    })).toBe('margin:md@sm@dark')
    expect(suggestCanonicalClassName('m:var(--spacing-md)@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferVariableReferences: false
    })).toBe('m:var(--spacing-md)@sm@dark')
    expect(suggestCanonicalClassName('m:1rem|1.5rem@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferMultiValueTokens: false
    })).toBe('m:1rem|1.5rem@sm@dark')
  })

  test('uses custom manifest modes, breakpoints, tokens, and utilities', () => {
    expect(suggestCanonicalClassName('block@midnight@tablet', customCSS)).toBe('block@tablet@midnight')
    expect(suggestCanonicalClassName('m:1.25rem@midnight@tablet', customCSS)).toBe('m:card@tablet@midnight')
    expect(suggestCanonicalClassName('content-visibility:auto', customCSS)).toBe('content-auto')
  })

  test('does not treat custom variants or component utilities as utilities-only canonical targets', () => {
    expect(customCSS.generate('block@midnight@wide')).toHaveLength(1)
    expect(suggestCanonicalClassName('block@midnight@wide', customCSS)).toBeUndefined()
    expect(suggestCanonicalClassName('btn@midnight@tablet', customCSS)).toBeUndefined()
  })

  test('ignores manifest-carried key alias and native namespace registry fields', () => {
    expect(suggestCanonicalClassName('margin:card', registryFieldCSS)).toBe('m:card')
    expect(suggestCanonicalClassName('--space:card', registryFieldCSS)).toBeUndefined()
  })

  test('does not suggest partial multi-value or unknown variable tokens', () => {
    expect(suggestCanonicalClassName('m:1rem|1.125rem', css)).toBeUndefined()
    expect(suggestCanonicalClassName('m:var(--spacing-unknown)', css)).toBeUndefined()
  })

  test('does not suggest unsafe condition or selector suffix order', () => {
    expect(suggestCanonicalClassName('block@sm:hover', css)).toBeUndefined()
    expect(suggestCanonicalClassName('block:focus:hover', css)).toBeUndefined()
    expect(suggestCanonicalClassName('block@start@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName('block@print@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName('block@supports(display:grid)@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName('font:error@dark@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName('unknown-class@dark@sm', css)).toBeUndefined()
  })

  test('respects canonical suggestion options', () => {
    expect(suggestCanonicalClassName('display:block', css, {
      ...defaultCanonicalClassNameOptions,
      preferStaticUtilities: false
    })).toBeUndefined()
    expect(suggestCanonicalClassName('font:16px', css, {
      ...defaultCanonicalClassNameOptions,
      preferThemeTokens: false
    })).toBeUndefined()
    expect(suggestCanonicalClassName('margin:md', css, {
      ...defaultCanonicalClassNameOptions,
      preferPropertyAliases: false
    })).toBeUndefined()
    expect(suggestCanonicalClassName('m:var(--spacing-md)', css, {
      ...defaultCanonicalClassNameOptions,
      preferVariableReferences: false
    })).toBeUndefined()
    expect(suggestCanonicalClassName('m:1rem|1.5rem', css, {
      ...defaultCanonicalClassNameOptions,
      preferMultiValueTokens: false
    })).toBeUndefined()
    expect(suggestCanonicalClassName('block@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferConditionOrder: false
    })).toBeUndefined()
  })

  test('does not suggest component-layer semantic utilities', () => {
    const componentCSS = createCSSWithNativeDeclarations(createPresetManifest({
      utilities: [
        {
          name: 'btn',
          type: UtilityType.Semantic,
          layer: 'components',
          declarations: { display: 'block' }
        }
      ]
    }))
    expect(suggestCanonicalClassName('btn', componentCSS)).toBeUndefined()
    expect(suggestCanonicalClassName('btn@dark@sm', componentCSS)).toBeUndefined()
  })
})

describe('canonical class group suggestions', () => {
  test('suggests size composition utilities', () => {
    expect(suggestCanonicalClassGroups(['w:md', 'h:md'], css)).toEqual([
      { classNames: ['w:md', 'h:md'], recommended: 'size:md' }
    ])
    expect(suggestCanonicalClassGroups(['width:md', 'height:md'], css)).toEqual([
      { classNames: ['width:md', 'height:md'], recommended: 'size:md' }
    ])
    expect(suggestCanonicalClassGroups(['w:1rem', 'h:1rem'], css)).toEqual([
      { classNames: ['w:1rem', 'h:1rem'], recommended: 'size:1rem' }
    ])
    expect(suggestCanonicalClassGroups(['w:md:hover', 'h:md:hover'], css)).toEqual([
      { classNames: ['w:md:hover', 'h:md:hover'], recommended: 'size:md:hover' }
    ])
  })

  test('suggests min and max size composition utilities', () => {
    expect(suggestCanonicalClassGroups(['min-w:md', 'min-h:md'], css)).toEqual([
      { classNames: ['min-w:md', 'min-h:md'], recommended: 'min-size:md' }
    ])
    expect(suggestCanonicalClassGroups(['max-w:md', 'max-h:md'], css)).toEqual([
      { classNames: ['max-w:md', 'max-h:md'], recommended: 'max-size:md' }
    ])
  })

  test('suggests spacing axis composition utilities', () => {
    expect(suggestCanonicalClassGroups(['mt:md', 'mb:md'], css)).toEqual([
      { classNames: ['mt:md', 'mb:md'], recommended: 'my:md' }
    ])
    expect(suggestCanonicalClassGroups(['ml:md', 'mr:md'], css)).toEqual([
      { classNames: ['ml:md', 'mr:md'], recommended: 'mx:md' }
    ])
    expect(suggestCanonicalClassGroups(['pt:md', 'pb:md'], css)).toEqual([
      { classNames: ['pt:md', 'pb:md'], recommended: 'py:md' }
    ])
    expect(suggestCanonicalClassGroups(['pl:md', 'pr:md'], css)).toEqual([
      { classNames: ['pl:md', 'pr:md'], recommended: 'px:md' }
    ])
    expect(suggestCanonicalClassGroups(['mt:md:hover@sm', 'mb:md:hover@sm'], css)).toEqual([
      { classNames: ['mt:md:hover@sm', 'mb:md:hover@sm'], recommended: 'my:md:hover@sm' }
    ])
  })

  test('suggests spacing axis composition after canonicalization', () => {
    expect(suggestCanonicalClassGroups(['margin-top:md', 'margin-bottom:md'], css)).toEqual([
      { classNames: ['margin-top:md', 'margin-bottom:md'], recommended: 'my:md' }
    ])
    expect(suggestCanonicalClassGroups(['padding-left:1rem', 'padding-right:1rem'], css)).toEqual([
      { classNames: ['padding-left:1rem', 'padding-right:1rem'], recommended: 'px:md' }
    ])
    expect(suggestCanonicalClassGroups(['mt:md@dark@sm', 'mb:md@dark@sm'], css)).toEqual([
      { classNames: ['mt:md@dark@sm', 'mb:md@dark@sm'], recommended: 'my:md@sm@dark' }
    ])
  })

  test('does not suggest unsafe composition groups', () => {
    expect(suggestCanonicalClassGroups(['w:md', 'h:lg'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['w:md', 'h:md@sm'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['w:error', 'h:md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt:md', 'mb:lg'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt:md', 'mb:md@sm'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt:error', 'mb:md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['w:md', 'h:md'], css, {
      ...defaultCanonicalClassNameOptions,
      preferCompositionUtilities: false
    })).toEqual([])
  })
})

describe('canonical compose directive suggestions', () => {
  test('keeps canonical utilities and extracts native declarations', () => {
    expect(suggestCanonicalComposeDirective('text-align:center contain:content', css)).toEqual({
      suggestions: [
        {
          actual: 'text-align:center',
          recommended: 'text-center',
          classNames: ['text-align:center'],
          kind: 'class'
        },
        {
          actual: 'contain:content',
          recommended: 'contain: content',
          classNames: ['contain:content'],
          kind: 'native-declaration'
        }
      ],
      structuralChange: true,
      replacement: '@compose text-center;\ncontain: content;'
    })
  })

  test('extracts variant suffixes into variant blocks', () => {
    expect(suggestCanonicalComposeDirective('bg:blue-60:hover@sm block@dark', css)).toEqual({
      suggestions: [
        {
          actual: 'bg:blue-60:hover@sm',
          recommended: '&:hover { @variant sm { @compose bg:blue-60; } }',
          classNames: ['bg:blue-60:hover@sm'],
          kind: 'variant-block'
        },
        {
          actual: 'block@dark',
          recommended: '@dark { @compose block; }',
          classNames: ['block@dark'],
          kind: 'variant-block'
        }
      ],
      structuralChange: true,
      replacement: '&:hover { @variant sm { @compose bg:blue-60; } }\n@dark { @compose block; }'
    })
  })

  test('extracts important native declarations', () => {
    expect(suggestCanonicalComposeDirective('contain:content!', css)).toEqual({
      suggestions: [
        {
          actual: 'contain:content!',
          recommended: 'contain: content !important',
          classNames: ['contain:content!'],
          kind: 'native-declaration'
        }
      ],
      structuralChange: true,
      replacement: 'contain: content !important;'
    })
  })

  test('does not extract token-backed, semantic, or alias classes as native declarations', () => {
    expect(suggestCanonicalComposeDirective('font:16px block width:10px', css, {
      ...defaultCanonicalClassNameOptions,
      preferThemeTokens: false,
      preferStaticUtilities: false,
      preferPropertyAliases: false
    })).toBeUndefined()
  })

  test('reports duplicate native declarations without autofix', () => {
    expect(suggestCanonicalComposeDirective('contain:content contain:none', css)).toEqual({
      suggestions: [
        {
          actual: 'contain:content',
          recommended: 'contain: content',
          classNames: ['contain:content'],
          kind: 'native-declaration'
        },
        {
          actual: 'contain:none',
          recommended: 'contain: none',
          classNames: ['contain:none'],
          kind: 'native-declaration'
        }
      ],
      structuralChange: true
    })
  })
})

test('exports default lint target settings', () => {
  expect(defaultClassLintSettings.classAttributes).toEqual(['class', 'className'])
  expect(defaultClassLintSettings.classFunctions).toContain('clsx')
  expect(defaultClassLintSettings.ignoredKeys).toContain('compoundVariants')
})
