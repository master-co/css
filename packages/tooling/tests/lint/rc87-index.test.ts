import { describe, expect, test, vi } from 'vitest'
import { UtilityType } from '@master/css-schema/utility-type'
import {
  createCSSWithNativeDeclarations,
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
  suggestCanonicalClassName
} from './rc87-compat'
import { createPresetManifest } from './helpers/create-preset-manifest'

const css = createCSSWithNativeDeclarations(createPresetManifest())
const customManifest = createPresetManifest({
  modes: ['light', 'dark', 'midnight'].map(name => ({ name, branches: [{ selector: `.${name}` }] })),
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
  test('sorts known classes and keeps unknown classes last', () => {
    expect(sortClassNames(['font-size:1.5rem', 'fg-white', 'm:0.5rem', 'p:0.5rem', 'bg-black'], css))
      .toEqual(['m:0.5rem', 'p:0.5rem', 'font-size:1.5rem', 'bg-black', 'fg-white'])
    expect(sortClassNames(['mt:0', 'hello:world', 'a', 'font:error'], css))
      .toEqual(['mt:0', 'font:error', 'hello:world', 'a'])
  })

  test('sorts generated classes into readable property groups', () => {
    const classNames = [
      'font-heavy',
      'bg-black:hover',
      'px:0.75rem@sm',
      'rel',
      'grid-cols:2@md',
      'opacity:.8',
      'z:10',
      'fg-white',
      'hidden@<md',
      'text-center',
      'm:0',
      'flex',
      'p:1rem',
      'unknown-app-class',
      'w:100%',
      'r-lg',
      'bg-blue-60',
      'gap:0.5rem',
      'overflow:hidden',
      'h:100%',
      'transition:opacity|.2s',
      'b:1px|solid|var(--color-gray-30)',
      'block@dark',
      'align-items:center',
      'mt:0.5rem',
      'box-shadow:0|2px|8px|#0003',
      'font-size:2.5rem@xs',
      '{content:``;block;h:100%;w:100%;abs}::after'
    ]

    expect(sortClassNames(classNames, css)).toEqual([
      'rel',
      'z:10',
      'flex',
      'overflow:hidden',
      'align-items:center',
      'gap:0.5rem',
      'h:100%',
      'w:100%',
      'm:0',
      'mt:0.5rem',
      'p:1rem',
      'r-lg',
      'b:1px|solid|var(--color-gray-30)',
      'font-heavy',
      'text-center',
      'bg-blue-60',
      'fg-white',
      'opacity:.8',
      'box-shadow:0|2px|8px|#0003',
      'transition:opacity|.2s',
      '{content:``;block;h:100%;w:100%;abs}::after',
      'bg-black:hover',
      'block@dark',
      'font-size:2.5rem@xs',
      'px:0.75rem@sm',
      'grid-cols:2@md',
      'hidden@<md',
      'unknown-app-class'
    ])
  })

  test('deduplicates repeated classes', () => {
    expect(sortClassNames(['w:0.75rem', 'w:0.375rem@lg', 'w:0.75rem'], css))
      .toEqual(['w:0.75rem', 'w:0.375rem@lg'])
  })

  test('generates each unique class once while sorting', () => {
    const generate = vi.fn((className: string) => css.generate(className))
    const cssWithGenerateSpy = { generate } as unknown as typeof css

    expect(sortClassNames(['w:0.75rem', 'w:0.375rem@lg', 'w:0.75rem'], cssWithGenerateSpy))
      .toEqual(['w:0.75rem', 'w:0.375rem@lg'])
    expect(generate).toHaveBeenCalledTimes(2)
  })
})

describe('class list edits', () => {
  test('sorts class-list text while preserving useful whitespace and raw tokens', () => {
    expect(sortClassList('fg-white  m:0.5rem\tfg-white', css))
      .toBe('m:0.5rem  fg-white')
    expect(sortClassList('fg-white\nm:0.5rem\nfg-white', css))
      .toBe('m:0.5rem\nfg-white')
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
    expect(replaceClassNameInClassList('m-md block', 'm-md', 'mx-md mb-md'))
      .toBe('mx-md mb-md block')
    expect(replaceClassNameInClassList('a a b', 'a', 'c'))
      .toBe('c a b')
  })

  test('replaces grouped class-list tokens', () => {
    expect(replaceClassGroupInClassList('w-md h-md fg-red-60', ['w-md', 'h-md'], 'size-md'))
      .toBe('size-md fg-red-60')
    expect(replaceClassGroupInClassList('w-md\n  h-md\n  fg-red-60', ['w-md', 'h-md'], 'size-md'))
      .toBe('size-md\n  fg-red-60')
    expect(replaceClassGroupInClassList('w-md h-md w-md', ['w-md', 'h-md'], 'size-md'))
      .toBe('size-md w-md')
    expect(replaceClassGroupInClassList('h-md fg-red-60', ['w-md', 'h-md'], 'size-md'))
      .toBe('h-md fg-red-60')
    expect(replaceClassGroupInClassList('content:\\`\\` block', ['content:``', 'block'], 'content:none', { unescape: '`' }))
      .toBe('content:none')
  })
})

describe('lint diagnostics', () => {
  test('reports sort diagnostics with a machine-readable fix', () => {
    expect(createSortClassesReport('fg-white m:0.5rem', css)).toEqual({
      diagnostics: [{
        ruleId: 'sort-classes',
        code: 'invalid-class-order',
        message: 'Sort classes into the expected order: "m:0.5rem fg-white".',
        severity: 'warning',
        range: { start: 0, end: 17 },
        data: {
          actual: 'fg-white m:0.5rem',
          expected: 'm:0.5rem fg-white'
        },
        fix: {
          range: { start: 0, end: 17 },
          text: 'm:0.5rem fg-white',
          scope: 'class-list'
        }
      }]
    })
  })

  test('reports conflict diagnostics with token-relative ranges', () => {
    expect(createConflictingClassesReport('m:10px m:20px m:30px', css).diagnostics[0]?.message)
      .toBe('Remove classes "m:10px m:20px"; they are overridden by class "m:30px" in generated CSS.')

    const report = createConflictingClassesReport('mx-md ml-lg', css)
    // Logical axes cannot be split into physical sides without changing behavior.
    expect(report.diagnostics).toEqual([])
    expect(JSON.parse(JSON.stringify(report))).toEqual(report)
  })

  test('reports invalid generated CSS diagnostics with class context', () => {
    expect(createInvalidClassesReport('padding:red', css).diagnostics[0]?.message)
      .toBe('Class "padding:red" emits invalid CSS: Invalid CSS value: padding:red.')
  })

  test('reports canonical diagnostics with explicit replacements', () => {
    expect(createCanonicalClassesReport('margin-md@dark@sm', css).diagnostics.map(({ message }) => message))
      .toEqual(['Use canonical class "m-md@dark@sm" instead of "margin-md@dark@sm".'])
    expect(createCanonicalClassesReport('font-size:16px w-md h-md', css).diagnostics).toEqual([])
  })

  test('keeps raw value policy opt-in in combined reports', () => {
    expect(createClassListLintReport('font-size:15px', css).diagnostics.map(({ code }) => code))
      .not.toContain('unapproved-raw-value')
    expect(createClassListLintReport('font-size:15px', css, {
      rules: { 'no-unapproved-raw-values': true }
    }).diagnostics.map(({ code }) => code))
      .toContain('unapproved-raw-value')
  })

  test('reports structural compose fixes with directive scope', () => {
    const report = createCanonicalComposeDirectiveReport('contain:content bg-blue-60:hover@sm', css)
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
      message: 'Use CSS declaration `contain: content` instead of class `contain:content`.'
    }))
    expect(report.diagnostics).toContainEqual(expect.objectContaining({
      code: 'prefer-variant-block',
      message: 'Move class `bg-blue-60:hover@sm` into the canonical @compose block.'
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
      content: '<div class="fg-white m:0.5rem"></div>',
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
        end: { line: 1, column: 30 }
      },
      fixes: [expect.objectContaining({
        kind: 'class-list',
        safety: 'safe',
        text: 'm:0.5rem fg-white'
      })]
    }))
    expect(fixMasterCSSContent({
      content: '<div class="fg-white m:0.5rem"></div>',
      filePath: '/project/index.html',
      css
    })).toBe('<div class="m:0.5rem fg-white"></div>')
    expect(summarizeMasterCSSLintFiles([result])).toMatchObject({
      files: 1,
      warnings: result.diagnostics.length,
      safeFixes: expect.any(Number)
    })
  })

  test('lints and fixes class lists inside mdx fenced html examples', () => {
    const content = [
      '```html',
      '<button class="inline-flex align-items:center gap:0.5rem px-md py-xs r-md fg-white bg-blue-60">',
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
      'sort-classes'
    ])
    expect(fixMasterCSSContent({
      content,
      filePath: '/project/content.mdx',
      css
    })).toBe([
      '```html',
      '<button class="inline-flex align-items:center gap:0.5rem py-xs px-md r-md bg-blue-60 fg-white">',
      '    Save',
      '</button>',
      '```'
    ].join('\n'))
  })

  test('passes rule options to source content diagnostics', () => {
    const content = [
      '```html',
      '<div class="btn font-size:15px w:17px"></div>',
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
        message: 'Raw value "15px" is not approved for class "font-size:15px". Use a token or allow the value explicitly.'
      }
    ])
  })

  test('applies source fixes until class lists are stable', () => {
    expect(fixMasterCSSContent({
      content: '<div class="size-md w-md h-md block"></div>',
      filePath: '/project/index.html',
      css
    })).toBe('<div class="block size-md h-md w-md"></div>')
  })

  test('uses script language ids for cjs and typescript module files', () => {
    expect(lintMasterCSSContent({
      content: 'const cls = "fg-white m:0.5rem"',
      filePath: '/project/component.cjs',
      css
    })).toMatchObject({
      languageId: 'javascript'
    })
    expect(lintMasterCSSContent({
      content: 'const cls = "fg-white m:0.5rem"',
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

  test('keeps the last rule in generated CSS regardless of input order', () => {
    expect(findClassConflicts(['m-sm', 'm-md', 'm-lg'], css))
      .toEqual([
        { className: 'm-lg', conflicts: ['m-sm'] },
        { className: 'm-md', conflicts: ['m-sm'] }
      ])
  })
})

describe('partial class conflicts', () => {
  test('does not automatically split margin axis classes when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['mx-md', 'ml-lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['mx-md', 'mr-lg'], css)).toEqual([])
  })

  test('does not automatically split padding shorthand classes when a later axis overrides part of them', () => {
    expect(findPartialClassConflicts(['p-md', 'px-lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['p-md', 'py-lg'], css)).toEqual([])
  })

  test('does not automatically split shorthand classes when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['m-md', 'mt-lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['p-md', 'pl-lg'], css)).toEqual([])
  })

  test('ignores different variants and fully overridden classes', () => {
    expect(findPartialClassConflicts(['mx-md', 'ml-lg@sm'], css)).toEqual([])
    expect(findPartialClassConflicts(['mx-md', 'mx-lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['mx-md', 'm-lg'], css)).toEqual([])
  })

  test('does not automatically split physical inset shorthands when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['inset-md', 'top-lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['inset-md', 'left-lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['inset-md@sm', 'top-lg@sm'], css)).toEqual([])
  })

  test('does not automatically split radius shorthands when a later corner overrides part of them', () => {
    expect(findPartialClassConflicts(['r-md', 'rtl-lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['r-md', 'rbr-lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['border-radius:.375rem', 'border-top-left-radius:.5rem'], css)).toEqual([])
  })

  test('does not automatically split border width shorthands when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['border-width:1px', 'border-top-width:2px'], css)).toEqual([])
    expect(findPartialClassConflicts(['border-width:0', 'border-left-width:1px'], css)).toEqual([])
    expect(findPartialClassConflicts(['border-width:1px', 'border-top-width:2px'], css)).toEqual([])
  })

  test('does not automatically split border color shorthands when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['b-red-60', 'bt-blue-60'], css)).toEqual([])
    expect(findPartialClassConflicts(['border-color-red-60', 'border-left-color-blue-60'], css)).toEqual([])
  })

  test('does not automatically split border style shorthands when a later side overrides part of them', () => {
    expect(findPartialClassConflicts(['b-solid', 'bt-dashed'], css)).toEqual([])
    expect(findPartialClassConflicts(['border-style:solid', 'border-bottom-style:dotted'], css)).toEqual([])
  })

  test('ignores unsupported partial conflict families', () => {
    expect(findPartialClassConflicts(['border-width:1px', 'border-top-width:2px@sm'], css)).toEqual([])
    expect(findPartialClassConflicts(['border-width:1px', 'border-width:2px'], css)).toEqual([])
    expect(findPartialClassConflicts(['border-width:1px', 'border-inline-width:2px'], css)).toEqual([])
    expect(findPartialClassConflicts(['ix-md', 'ixs-lg'], css)).toEqual([])
    expect(findPartialClassConflicts(['r:var(--radius-md)|var(--radius-lg)', 'rtl-xl'], css)).toEqual([])
    expect(findPartialClassConflicts(['unknown-class', 'btn'], css)).toEqual([])
  })
})

describe('class validation issues', () => {
  test('reports invalid generated CSS', () => {
    expect(getClassValidationIssues('padding:red', css)).toMatchObject([
      { kind: 'invalid', className: 'padding:red' }
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

  test('preserves unknown native properties without an unknown-class diagnostic', () => {
    expect(getClassValidationIssues('unknown:"value"', css, { disallowUnknownClass: true })).toEqual([])
    expect(getClassValidationIssues('text-decoration:future-function()', css)).toEqual([])
  })

  test('escapes quoted class names in diagnostic messages', () => {
    const className = 'unknown-"value"'
    expect(getClassValidationIssues(className, css, { disallowUnknownClass: true })[0]?.message)
      .toBe(`Unknown Master CSS class ${JSON.stringify(className)}. It is not generated by the active manifest.`)
  })
})

describe('raw value policy', () => {
  test('reports raw values in token-backed utilities', () => {
    expect(findUnapprovedRawValueClasses(['font-size:15px', 'm:17px', 'fg:#123456'], css)).toEqual([
      { className: 'font-size:15px', key: 'font-size', value: '15px', properties: ['font-size'] },
      { className: 'm:17px', key: 'm', value: '17px', properties: ['margin'] },
      { className: 'fg:#123456', key: 'fg', value: '#123456', properties: ['color'] }
    ])
  })

  test('allows raw values by property, key, pattern, or full opt-out', () => {
    expect(findUnapprovedRawValueClasses(['w:50%'], css, { allowProperties: ['width'] })).toEqual([])
    expect(findUnapprovedRawValueClasses(['w:50%'], css, { allowProperties: ['w'] })).toEqual([])
    expect(findUnapprovedRawValueClasses(['m:calc(1rem+1px)'], css, { allowedPatterns: ['^calc\\('] })).toEqual([])
    expect(findUnapprovedRawValueClasses(['font-size:15px'], css, { allowRawValues: true })).toEqual([])
  })

  test('applies raw value allowed patterns to individual multi-value segments', () => {
    expect(findUnapprovedRawValueClasses(['m:var(--spacing-md)|calc(1rem+1px)', 'm:calc(1rem+1px)|var(--spacing-md)'], css, {
      allowedPatterns: ['^calc\\(']
    })).toEqual([])
    expect(findUnapprovedRawValueClasses(['m:var(--spacing-md)|17px', 'm:calc(1rem+1px)|18px', 'm:19px|20px'], css, {
      allowedPatterns: ['^calc\\(']
    })).toEqual([
      { className: 'm:var(--spacing-md)|17px', key: 'm', value: '17px', properties: ['margin'] },
      { className: 'm:calc(1rem+1px)|18px', key: 'm', value: '18px', properties: ['margin'] },
      { className: 'm:19px|20px', key: 'm', value: '19px|20px', properties: ['margin'] }
    ])
  })

  test('uses active manifest tokens without treating registry fields as token namespaces', () => {
    expect(findUnapprovedRawValueClasses(['m-card', 'm:17px'], customCSS)).toEqual([
      { className: 'm:17px', key: 'm', value: '17px', properties: ['margin'] }
    ])
    expect(findUnapprovedRawValueClasses(['--space:17px'], registryFieldCSS)).toEqual([])
  })
})

describe('canonical class suggestions', () => {
  test('preserves literal multi-value declarations', () => {
    expect(suggestCanonicalClassName('m:1rem|1.5rem', css)).toBeUndefined()
    expect(suggestCanonicalClassName('p:.5rem|1rem', css)).toBeUndefined()
    expect(suggestCanonicalClassName('r:.25rem|.375rem', css)).toBeUndefined()
  })

  test('preserves explicit variable references and their priority', () => {
    expect(suggestCanonicalClassName('m:var(--spacing-md)', css)).toBeUndefined()
    expect(suggestCanonicalClassName('r:var(--radius-md)', css)).toBeUndefined()
    expect(suggestCanonicalClassName('fg:var(--color-red-60)', css)).toBeUndefined()
  })

  test('preserves condition suffix order when reordering changes rule priority', () => {
    expect(suggestCanonicalClassName('block@dark@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName('block:hover@dark@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName('block!@dark@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName('font-size:16px@dark@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName('text-align:center@dark@sm', css)).toBeUndefined()
  })

  test('combines condition order independently with canonical suggestion options', () => {
    expect(suggestCanonicalClassName('font-size:16px@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferConditionOrder: false
    })).toBeUndefined()
    expect(suggestCanonicalClassName('font-size:16px@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
    expect(suggestCanonicalClassName('font-size:16px@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferConditionOrder: false,
    })).toBeUndefined()
    expect(suggestCanonicalClassName('margin-md@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
      preferPropertyAliases: false
    })).toBeUndefined()
    expect(suggestCanonicalClassName('m:var(--spacing-md)@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
    expect(suggestCanonicalClassName('m:1rem|1.5rem@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
  })

  test('uses custom manifest modes, breakpoints, tokens, and utilities', () => {
    expect(suggestCanonicalClassName('block@midnight@tablet', customCSS)).toBeUndefined()
    expect(suggestCanonicalClassName('m:1.25rem@midnight@tablet', customCSS)).toBeUndefined()
    expect(suggestCanonicalClassName('content-visibility:auto', customCSS)).toBeUndefined()
  })

  test('does not treat custom variants or component utilities as utilities-only canonical targets', () => {
    expect(customCSS.generate('block@midnight@wide')).toHaveLength(1)
    expect(suggestCanonicalClassName('block@midnight@wide', customCSS)).toBeUndefined()
    expect(suggestCanonicalClassName('btn@midnight@tablet', customCSS)).toBeUndefined()
  })

  test('ignores manifest-carried key alias and native namespace registry fields', () => {
    expect(suggestCanonicalClassName('margin-card', registryFieldCSS)).toBe('m-card')
    expect(suggestCanonicalClassName('--space:card', registryFieldCSS)).toBeUndefined()
  })

  test('does not suggest partial multi-value or unknown variable tokens', () => {
    expect(suggestCanonicalClassName('m:1rem|1.125rem', css)).toBeUndefined()
    expect(suggestCanonicalClassName('m:var(--spacing-unknown)', css)).toBeUndefined()
  })

  test('does not suggest unsafe condition or selector suffix order', () => {
    expect(suggestCanonicalClassName('block@sm:hover', css)).toBeUndefined()
    expect(suggestCanonicalClassName('block:focus:hover', css)).toBeUndefined()
    expect(suggestCanonicalClassName('block@starting-style@sm', css)).toBeUndefined()
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
    expect(suggestCanonicalClassName('font-size:16px', css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
    expect(suggestCanonicalClassName('margin-md', css, {
      ...defaultCanonicalClassNameOptions,
      preferPropertyAliases: false
    })).toBeUndefined()
    expect(suggestCanonicalClassName('m:var(--spacing-md)', css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
    expect(suggestCanonicalClassName('m:1rem|1.5rem', css, {
      ...defaultCanonicalClassNameOptions,
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
  test('does not automatically merge size composition utilities', () => {
    expect(suggestCanonicalClassGroups(['w-md', 'h-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['width-md', 'height-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['w:1rem', 'h:1rem'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['w-md:hover', 'h-md:hover'], css)).toEqual([])
  })

  test('does not automatically merge min and max size composition utilities', () => {
    expect(suggestCanonicalClassGroups(['min-w-md', 'min-h-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['max-w-md', 'max-h-md'], css)).toEqual([])
  })

  test('does not automatically merge spacing axis composition utilities', () => {
    expect(suggestCanonicalClassGroups(['mt-md', 'mb-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['ml-md', 'mr-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['pt-md', 'pb-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['pl-md', 'pr-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt-md:hover@sm', 'mb-md:hover@sm'], css)).toEqual([])
  })

  test('does not automatically merge spacing axis composition after canonicalization', () => {
    expect(suggestCanonicalClassGroups(['margin-top-md', 'margin-bottom-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['padding-left:1rem', 'padding-right:1rem'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt-md@dark@sm', 'mb-md@dark@sm'], css)).toEqual([])
  })

  test('does not suggest unsafe composition groups', () => {
    expect(suggestCanonicalClassGroups(['w-md', 'h-lg'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['w-md', 'h-md@sm'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['w:error', 'h-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt-md', 'mb-lg'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt-md', 'mb-md@sm'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt:error', 'mb-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['w-md', 'h-md'], css, {
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
          recommended: 'text-align: center',
          classNames: ['text-align:center'],
          kind: 'native-declaration'
        },
        {
          actual: 'contain:content',
          recommended: 'contain: content',
          classNames: ['contain:content'],
          kind: 'native-declaration'
        }
      ],
      structuralChange: true,
      replacement: 'text-align: center;\ncontain: content;'
    })
  })

  test('extracts variant suffixes into variant blocks', () => {
    expect(suggestCanonicalComposeDirective('bg-blue-60:hover@sm block@dark', css)).toEqual({
      suggestions: [
        {
          actual: 'bg-blue-60:hover@sm',
          recommended: '&:hover { @variant sm { @compose bg-blue-60; } }',
          classNames: ['bg-blue-60:hover@sm'],
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
      replacement: '&:hover { @variant sm { @compose bg-blue-60; } }\n@dark { @compose block; }'
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
    expect(suggestCanonicalComposeDirective('font-md block w:10px', css, {
      ...defaultCanonicalClassNameOptions,
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
