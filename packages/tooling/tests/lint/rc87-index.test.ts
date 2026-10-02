import { describe, expect, test, vi } from 'vitest'
import { UtilityType } from '@master/css-schema/utility-type'
import {
  createCSSWithNativeDeclarations,
  defaultCanonicalClassNameOptions,
  defaultClassLintSettings,
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
  sortClassList,
  sortClassNames,
  suggestCanonicalClassName
} from './rc87-compat'
import { createPresetManifest } from './helpers/create-preset-manifest'

const css = createCSSWithNativeDeclarations(createPresetManifest())
const customManifest = createPresetManifest({
  customMedia: { '--tablet': { type: 'feature' as const, value: '(width>=48rem)' } },
  variables: [
    { namespace: 'breakpoint', key: 'tablet', name: 'breakpoint-tablet', type: 'number' as const, values: [{ path: [':root,:host'], value: '48rem' }], numeric: { value: 48, unit: 'rem' } },
    { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number' as const, values: [{ path: [':root,:host'], value: '1.25rem' }], numeric: { value: 1.25, unit: 'rem' } }
  ],
  mixins: [
    { name: '--midnight', body: [{ type: 'rule', selector: '&:where(.midnight,.midnight *)', body: [{ type: 'contents', fallback: [] }] }] },
    { name: '--wide', body: [{ type: 'condition', condition: '@media (min-width: 80rem)', body: [{ type: 'contents', fallback: [] }] }] },
  {
    "name": "--content-auto",
    "body": [
      {
        "type": "declaration" as const,
        "property": "content-visibility",
        "value": [
          {
            "type": "text" as const,
            "value": "auto"
          }
        ]
      }
    ]
  },
  {
    "name": "--btn",
    "body": [
      {
        "type": "declaration" as const,
        "property": "display",
        "value": [
          {
            "type": "text" as const,
            "value": "block"
          }
        ]
      }
    ]
  }
]
, utilities: [{"name":"midnight","body":[{"type":"rule" as const,"selector":"&:where(.midnight,.midnight *)","body":[{"type":"contents" as const,"fallback":[]}]}],"kind":"static" as const},{"name":"wide","body":[{"type":"condition" as const,"condition":"@media (min-width: 80rem)","body":[{"type":"contents" as const,"fallback":[]}]}],"kind":"static" as const},{"name":"content-auto","body":[{"type":"declaration" as const,"property":"content-visibility","value":[{"type":"text" as const,"value":"auto"}]}],"kind":"static" as const},{"name":"btn","body":[{"type":"declaration" as const,"property":"display","value":[{"type":"text" as const,"value":"block"}]}],"kind":"static" as const}] })
const customCSS = createCSSWithNativeDeclarations(customManifest)

type PresetManifestInput = Parameters<typeof createPresetManifest>[0]
const registryFieldCSS = createCSSWithNativeDeclarations(createPresetManifest({
  variables: [
    { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number' as const, values: [{ path: [':root,:host'], value: '1.25rem' }], numeric: { value: 1.25, unit: 'rem' } }
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
    expect(sortClassNames(['font-size:1.5rem', 'fg-white', "margin:0.5rem", "padding:0.5rem", 'bg-black'], css))
      .toEqual(["margin:0.5rem", "padding:0.5rem", 'font-size:1.5rem', 'bg-black', 'fg-white'])
    expect(sortClassNames(["margin-top:0", 'hello:world', 'a', 'font:error'], css))
      .toEqual(["margin-top:0", 'font:error', 'hello:world', 'a'])
  })

  test('sorts generated classes into readable property groups', () => {
    const classNames = [
      'font-heavy',
      'bg-black:hover',
      "padding-inline:0.75rem@sm",
      "position:relative",
      "grid-cols(2)@md",
      'opacity:.8',
      "z-index:10",
      'fg-white',
      'hidden@<md',
      "text-align:center",
      "margin:0",
      "display:flex",
      "padding:1rem",
      'unknown-app-class',
      "width:100%",
      'r-lg',
      'bg-blue-60',
      'gap:0.5rem',
      'overflow:hidden',
      "height:100%",
      'transition:opacity|.2s',
      "border:1px|solid|var(--color-gray-30)",
      "display:block@dark",
      'align-items:center',
      "margin-top:0.5rem",
      'box-shadow:0|2px|8px|#0003',
      'font-size:2.5rem@xs',
    ]

    expect(sortClassNames(classNames, css)).toEqual([
      "position:relative",
      "z-index:10",
      "display:flex",
      'overflow:hidden',
      'align-items:center',
      'gap:0.5rem',
      "height:100%",
      "width:100%",
      "margin-top:0.5rem",
      "margin:0",
      "padding:1rem",
      'r-lg',
      "border:1px|solid|var(--color-gray-30)",
      'font-heavy',
      "text-align:center",
      'bg-blue-60',
      'fg-white',
      'opacity:.8',
      'box-shadow:0|2px|8px|#0003',
      'transition:opacity|.2s',
            'bg-black:hover',
      "display:block@dark",
      'font-size:2.5rem@xs',
      "padding-inline:0.75rem@sm",
      "grid-cols(2)@md",
      'hidden@<md',
      'unknown-app-class'
    ])
  })

  test('deduplicates repeated classes', () => {
    expect(sortClassNames(["width:0.75rem", "width:0.375rem@lg", "width:0.75rem"], css))
      .toEqual(["width:0.75rem", "width:0.375rem@lg"])
  })

  test('generates each unique class once while sorting', () => {
    const generate = vi.fn((className: string) => css.generate(className))
    const cssWithGenerateSpy = { generate } as unknown as typeof css

    expect(sortClassNames(["width:0.75rem", "width:0.375rem@lg", "width:0.75rem"], cssWithGenerateSpy))
      .toEqual(["width:0.75rem", "width:0.375rem@lg"])
    expect(generate).toHaveBeenCalledTimes(2)
  })
})

describe('class list edits', () => {
  test('sorts class-list text while preserving useful whitespace and raw tokens', () => {
    expect(sortClassList("fg-white  margin:0.5rem\tfg-white", css))
      .toBe("margin:0.5rem  fg-white")
    expect(sortClassList("fg-white\nmargin:0.5rem\nfg-white", css))
      .toBe("margin:0.5rem\nfg-white")
    expect(sortClassList("content:\\`\\` display:block", css, { unescape: '`' }))
      .toBe("display:block content:\\`\\`")
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
    expect(replaceClassNameInClassList("content:\\'\\' display:block", 'content:\'\'', 'content:""', { unescape: '\'' }))
      .toBe("content:\"\" display:block")
    expect(replaceClassNameInClassList("content:\\`\\` display:block", 'content:``', 'content:none', { unescape: '`' }))
      .toBe("content:none display:block")
    expect(replaceClassNameInClassList("m-md display:block", 'm-md', 'mx-md mb-md'))
      .toBe("mx-md mb-md display:block")
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
    expect(replaceClassGroupInClassList("content:\\`\\` display:block", ['content:``', "display:block"], 'content:none', { unescape: '`' }))
      .toBe('content:none')
  })
})

describe('lint diagnostics', () => {
  test('reports sort diagnostics with a machine-readable fix', () => {
    expect(createSortClassesReport("fg-white margin:0.5rem", css)).toEqual({
      diagnostics: [{
        ruleId: 'sort-classes',
        code: 'invalid-class-order',
        message: "Sort classes into the expected order: \"margin:0.5rem fg-white\".",
        severity: 'warning',
        range: { start: 0, end: 22 },
        data: {
          actual: "fg-white margin:0.5rem",
          expected: "margin:0.5rem fg-white"
        },
        fix: {
          range: { start: 0, end: 22 },
          text: "margin:0.5rem fg-white",
          scope: 'class-list'
        }
      }]
    })
  })

  test('reports conflict diagnostics with token-relative ranges', () => {
    expect(createConflictingClassesReport("margin:10px margin:20px margin:30px", css).diagnostics[0]?.message)
      .toBe("Remove classes \"margin:10px margin:20px\"; they are overridden by class \"margin:30px\" in generated CSS.")

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
      .toEqual([])
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
      content: "<div class=\"fg-white margin:0.5rem\"></div>",
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
        end: { line: 1, column: 35 }
      },
      fixes: [expect.objectContaining({
        kind: 'class-list',
        safety: 'safe',
        text: "margin:0.5rem fg-white"
      })]
    }))
    expect(fixMasterCSSContent({
      content: "<div class=\"fg-white margin:0.5rem\"></div>",
      filePath: '/project/index.html',
      css
    })).toBe("<div class=\"margin:0.5rem fg-white\"></div>")
    expect(summarizeMasterCSSLintFiles([result])).toMatchObject({
      files: 1,
      warnings: result.diagnostics.length,
      safeFixes: expect.any(Number)
    })
  })

  test('leaves MDX fenced examples untouched', () => {
    const content = "```html\n<button class=\"fg-white padding:1rem\">Save</button>\n```"
    expect(lintMasterCSSContent({ content, filePath: '/project/content.mdx', css }).diagnostics).toEqual([])
    expect(fixMasterCSSContent({ content, filePath: '/project/content.mdx', css })).toBe(content)
  })

  test('passes rule options to source content diagnostics', () => {
    const content = "<div class=\"btn font-size:15px width:17px\"></div>"
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
      content: '<div class="w-md h-md display:block"></div>',
      filePath: '/project/index.html',
      css
    })).toBe("<div class=\"display:block h-md w-md\"></div>")
  })

  test('uses script language ids for cjs and typescript module files', () => {
    expect(lintMasterCSSContent({
      content: "const cls = \"fg-white margin:0.5rem\"",
      filePath: '/project/component.cjs',
      css
    })).toMatchObject({
      languageId: 'javascript'
    })
    expect(lintMasterCSSContent({
      content: "const cls = \"fg-white margin:0.5rem\"",
      filePath: '/project/component.mts',
      css
    })).toMatchObject({
      languageId: 'typescript'
    })
  })

  test('leaves removed compose statements to compiler diagnostics', () => {
    const content = '.btn { @compose contain:content; }'
    expect(lintMasterCSSContent({ content, filePath: '/project/index.css', css }).diagnostics).toEqual([])
    expect(fixMasterCSSContent({ content, filePath: '/project/index.css', css })).toBe(content)
  })

})

describe('class conflicts', () => {
  test('finds classes with matching declarations and variants', () => {
    expect(findClassConflicts(["margin:10px", "margin:20px", "margin:30px:hover", "margin:40px@dark"], css))
      .toEqual([
        { className: "margin:10px", conflicts: ["margin:20px"] }
      ])
  })

  test('ignores invalid classes', () => {
    expect(findClassConflicts(['a', 'hello:world', "margin:10px", "margin:20px"], css))
      .toEqual([
        { className: "margin:10px", conflicts: ["margin:20px"] }
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
  test.each([
    ['mt-lg', 'm-md'],
    ['pl-lg', 'p-md'],
    ['inset-md', 'top-lg'],
    ['inset-md', 'left-lg'],
    ['inset-md@sm', 'top-lg@sm'],
    ['r-md', 'rtl-lg'],
    ['rbr-lg', 'r-md'],
    ['border-radius:.375rem', 'border-top-left-radius:.5rem'],
    ['border-top-width:2px', 'border-width:1px'],
    ['border-left-width:1px', 'border-width:0'],
    ['b-red-60', 'bt-blue-60'],
    ['b-red-60', 'bl-blue-60'],
    ['border-style:solid', 'border-top-style:dashed'],
    ['border-bottom-style:dotted', 'border-style:solid'],
    ['ixs-lg', 'ix-md']
  ])('reports %s overridden by %s without a replacement', (className, conflict) => {
    const expected = [{ className, conflict }]
    expect(findPartialClassConflicts([className, conflict], css)).toEqual(expected)
    expect(findPartialClassConflicts([conflict, className], css)).toEqual(expected)
    const report = createConflictingClassesReport(`${className} ${conflict}`, css)
    expect(report.diagnostics.every(diagnostic => diagnostic.fix === undefined)).toBe(true)
  })

  test.each([
    ['mx-md', 'ml-lg'],
    ['p-md', 'px-lg'],
    ['p-md', 'py-lg'],
    ['mx-md', 'ml-lg@sm'],
    ['mx-md', 'mx-lg'],
    ['mx-md', 'm-lg'],
    ['border-width:1px', 'border-top-width:2px@sm'],
    ['border-width:1px', 'border-width:2px'],
    ['border-width:1px', 'border-inline-width:2px'],
    ['unknown-class', 'btn']
  ])('does not infer a partial overlap between %s and %s', (first, second) => {
    expect(findPartialClassConflicts([first, second], css)).toEqual([])
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
    expect(findUnapprovedRawValueClasses(['font-size:15px', "margin:17px", "color:#123456"], css)).toEqual([
      { className: 'font-size:15px', key: 'font-size', value: '15px', properties: ['font-size'] },
      { className: "margin:17px", key: 'margin', value: '17px', properties: ['margin'] },
      { className: "color:#123456", key: 'color', value: '#123456', properties: ['color'] }
    ])
  })

  test('allows raw values by property, key, pattern, or full opt-out', () => {
    expect(findUnapprovedRawValueClasses(["width:50%"], css, { allowProperties: ['width'] })).toEqual([])
    expect(findUnapprovedRawValueClasses(["width:50%"], css, { allowProperties: ['width'] })).toEqual([])
    expect(findUnapprovedRawValueClasses(["margin:calc(1rem+1px)"], css, { allowedPatterns: ['^calc\\('] })).toEqual([])
    expect(findUnapprovedRawValueClasses(['font-size:15px'], css, { allowRawValues: true })).toEqual([])
  })

  test('applies raw value allowed patterns to individual multi-value segments', () => {
    expect(findUnapprovedRawValueClasses(["margin:var(--spacing-md)|calc(1rem+1px)", "margin:calc(1rem+1px)|var(--spacing-md)"], css, {
      allowedPatterns: ['^calc\\(']
    })).toEqual([])
    expect(findUnapprovedRawValueClasses(["margin:var(--spacing-md)|17px", "margin:calc(1rem+1px)|18px", "margin:19px|20px"], css, {
      allowedPatterns: ['^calc\\(']
    })).toEqual([
      { className: "margin:var(--spacing-md)|17px", key: 'margin', value: '17px', properties: ['margin'] },
      { className: "margin:calc(1rem+1px)|18px", key: 'margin', value: '18px', properties: ['margin'] },
      { className: "margin:19px|20px", key: 'margin', value: '19px|20px', properties: ['margin'] }
    ])
  })

  test('uses active manifest tokens without treating registry fields as token namespaces', () => {
    expect(findUnapprovedRawValueClasses(['m-card', "margin:17px"], customCSS)).toEqual([
      { className: "margin:17px", key: 'margin', value: '17px', properties: ['margin'] }
    ])
    expect(findUnapprovedRawValueClasses(['--space:17px'], registryFieldCSS)).toEqual([])
  })
})

describe('canonical class suggestions', () => {
  test('preserves literal multi-value declarations', () => {
    expect(suggestCanonicalClassName("margin:1rem|1.5rem", css)).toBeUndefined()
    expect(suggestCanonicalClassName("padding:.5rem|1rem", css)).toBeUndefined()
    expect(suggestCanonicalClassName('r:.25rem|.375rem', css)).toBeUndefined()
  })

  test('preserves explicit variable references and their priority', () => {
    expect(suggestCanonicalClassName("margin:var(--spacing-md)", css)).toBeUndefined()
    expect(suggestCanonicalClassName('r:var(--radius-md)', css)).toBeUndefined()
    expect(suggestCanonicalClassName("color:var(--color-red-60)", css)).toBeUndefined()
  })

  test('preserves condition suffix order when reordering changes rule priority', () => {
    expect(suggestCanonicalClassName("display:block@dark@sm", css)).toBeUndefined()
    expect(suggestCanonicalClassName('block:hover@dark@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName("display:block!@dark@sm", css)).toBeUndefined()
    expect(suggestCanonicalClassName('font-size:16px@dark@sm', css)).toBeUndefined()
    expect(suggestCanonicalClassName('text-align:center@dark@sm', css)).toBeUndefined()
  })

  test('combines condition order independently with canonical suggestion options', () => {
    expect(suggestCanonicalClassName('font-size:16px@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,

    })).toBeUndefined()
    expect(suggestCanonicalClassName('font-size:16px@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
    expect(suggestCanonicalClassName('font-size:16px@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,

    })).toBeUndefined()
    expect(suggestCanonicalClassName('margin-md@dark@sm', css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
    expect(suggestCanonicalClassName("margin:var(--spacing-md)@dark@sm", css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
    expect(suggestCanonicalClassName("margin:1rem|1.5rem@dark@sm", css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
  })

  test('uses custom manifest modes, breakpoints, tokens, and utilities', () => {
    expect(suggestCanonicalClassName("display:block@apply(--midnight)@tablet", customCSS)).toBeUndefined()
    expect(suggestCanonicalClassName("margin:1.25rem@apply(--midnight)@tablet", customCSS)).toBeUndefined()
    expect(suggestCanonicalClassName('content-visibility:auto', customCSS)).toBeUndefined()
  })

  test('does not treat custom variants or component utilities as utilities-only canonical targets', () => {
    expect(customCSS.generate("display:block@apply(--midnight)@apply(--wide)")).toHaveLength(1)
    expect(suggestCanonicalClassName("display:block@apply(--midnight)@apply(--wide)", customCSS)).toBeUndefined()
    expect(suggestCanonicalClassName('btn@apply(--midnight)@tablet', customCSS)).toBeUndefined()
  })

  test('ignores manifest-carried key alias and native namespace registry fields', () => {
    expect(suggestCanonicalClassName('margin-card', registryFieldCSS)).toBeUndefined()
    expect(suggestCanonicalClassName('--space:card', registryFieldCSS)).toBeUndefined()
  })

  test('does not suggest partial multi-value or unknown variable tokens', () => {
    expect(suggestCanonicalClassName("margin:1rem|1.125rem", css)).toBeUndefined()
    expect(suggestCanonicalClassName("margin:var(--spacing-unknown)", css)).toBeUndefined()
  })

  test('does not suggest unsafe condition or selector suffix order', () => {
    expect(suggestCanonicalClassName("display:block@sm:hover", css)).toBeUndefined()
    expect(suggestCanonicalClassName('block:focus:hover', css)).toBeUndefined()
    expect(suggestCanonicalClassName("display:block@starting-style@sm", css)).toBeUndefined()
    expect(suggestCanonicalClassName("display:block@media(print)@sm", css)).toBeUndefined()
    expect(suggestCanonicalClassName("display:block@supports(display:grid)@sm", css)).toBeUndefined()
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
    })).toBeUndefined()
    expect(suggestCanonicalClassName("margin:var(--spacing-md)", css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
    expect(suggestCanonicalClassName("margin:1rem|1.5rem", css, {
      ...defaultCanonicalClassNameOptions,
    })).toBeUndefined()
    expect(suggestCanonicalClassName("display:block@dark@sm", css, {
      ...defaultCanonicalClassNameOptions,

    })).toBeUndefined()
  })

  test('does not suggest component-layer semantic utilities', () => {
    const componentCSS = createCSSWithNativeDeclarations(createPresetManifest({
      mixins: [
  {
    "name": "--btn",
    "body": [
      {
        "type": "declaration" as const,
        "property": "display",
        "value": [
          {
            "type": "text" as const,
            "value": "block"
          }
        ]
      }
    ]
  }
]
    , utilities: [{"name":"btn","body":[{"type":"declaration" as const,"property":"display","value":[{"type":"text" as const,"value":"block"}]}],"kind":"static" as const}] }))
    expect(suggestCanonicalClassName('btn', componentCSS)).toBeUndefined()
    expect(suggestCanonicalClassName('btn@dark@sm', componentCSS)).toBeUndefined()
  })
})

describe('canonical class group suggestions', () => {
  test('does not automatically merge size composition utilities', () => {
    expect(suggestCanonicalClassGroups(['w-md', 'h-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['width-md', 'height-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(["width:1rem", "height:1rem"], css)).toEqual([])
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
    expect(suggestCanonicalClassGroups(["width:error", 'h-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt-md', 'mb-lg'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['mt-md', 'mb-md@sm'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(["margin-top:error", 'mb-md'], css)).toEqual([])
    expect(suggestCanonicalClassGroups(['w-md', 'h-md'], css, {
      ...defaultCanonicalClassNameOptions,
      preferCompositionUtilities: false
    })).toEqual([])
  })
})


test('exports default lint target settings', () => {
  expect(defaultClassLintSettings.classAttributes).toEqual(['class', 'className'])
  expect(defaultClassLintSettings.classFunctions).toContain('clsx')
  expect(defaultClassLintSettings.ignoredKeys).toContain('compoundVariants')
})
