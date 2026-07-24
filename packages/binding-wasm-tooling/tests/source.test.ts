import { readFile } from 'node:fs/promises'
import { expect, test, vi } from 'vitest'
import { initToolingWasm } from '../src'

test('keys explicit tooling modules by their initialization input', async () => {
  const module = {
    default: vi.fn(async () => ({}))
  }
  const input = new Uint8Array([1])

  await initToolingWasm({ module, input })
  await initToolingWasm({ module, input })
  expect(module.default).toHaveBeenCalledTimes(1)
  await expect(initToolingWasm({
    module,
    input: new Uint8Array([2])
  })).rejects.toMatchObject({
    code: 'WASM_INPUT_CONFLICT',
    domain: 'binding'
  })
})

test('normalizes tooling Wasm initialization failures', async () => {
  const cause = new TypeError('fetch failed')
  await expect(initToolingWasm({
    module: {
      default: vi.fn(async () => {
        throw cause
      })
    },
    input: new Uint8Array([1])
  })).rejects.toMatchObject({
    code: 'WASM_LOAD_FAILED',
    domain: 'binding',
    cause
  })
})

test('loads the isolated source tooling Wasm surface', async () => {
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_binding_wasm_tooling_bg.wasm',
    import.meta.url
  )))
  const tooling = await initToolingWasm({ input })
  expect(tooling.extractOxcClasses(
    'component.tsx',
    'const classes = "block mx:auto"; import value from "ignored"'
  )).toEqual(['block', 'mx:auto'])
  expect(tooling.extractHTMLClasses(
    'index.html',
    '<main class="grid"><script>const classes = "fg:red"</script></main>'
  )).toEqual(['grid', 'fg:red'])

  const scanner = new tooling.ToolingScannerSession(JSON.stringify({
    version: 1,
    utilities: [{
      id: 'display-block',
      name: 'block',
      type: 0,
      emit: {
        type: 'static',
        rules: [{ declarations: { display: 'block' } }]
      },
      matchers: [{ type: 'static', name: 'block' }]
    }]
  }))
  expect(scanner.scan('component.tsx', 'const classes = "block unknown"')).toMatchObject({
    changed: true,
    validClasses: ['block'],
    invalidClasses: ['unknown']
  })
  expect(scanner.state()).toMatchObject({
    latentClasses: ['block', 'unknown'],
    cachedSources: 1
  })
  scanner.dispose()
  scanner.free()

  const validator = new tooling.ToolingValidatorSession(JSON.stringify({
    version: 1,
    utilities: [{
      id: 'display-block',
      name: 'block',
      type: 0,
      emit: {
        type: 'static',
        rules: [{ declarations: { display: 'block' } }]
      },
      matchers: [{ type: 'static', name: 'block' }]
    }]
  }))
  expect(validator.generateClasses(['block', 'unknown'])).toMatchObject({
    version: 1,
    classes: [
      { className: 'block', matched: true, rules: [{ text: '.block{display:block}' }] },
      { className: 'unknown', matched: false, rules: [] }
    ]
  })
  validator.dispose()
  validator.free()

  const lint = new tooling.ToolingLintSession(JSON.stringify({
    version: 1,
    variables: {
      spacing: [{ key: 'md', type: 'number', value: '1rem' }]
    },
    utilities: [
      {
        id: 'display-block',
        name: 'block',
        type: -2,
        emit: {
          type: 'static',
          rules: [{ declarations: { display: 'block' } }]
        },
        matchers: [{ type: 'static', name: 'block' }]
      },
      {
        id: 'margin',
        name: 'm:',
        type: -1,
        variableAliasRefs: ['~spacing'],
        emit: { type: 'property', property: 'margin' },
        matchers: [{ type: 'key', keys: ['m'] }]
      },
      {
        id: 'margin-x',
        name: 'mx:',
        type: -1,
        emit: {
          type: 'template',
          declarations: { 'margin-right': null, 'margin-left': null }
        },
        matchers: [{ type: 'key', keys: ['mx'] }]
      },
      {
        id: 'margin-left',
        name: 'ml:',
        type: -1,
        emit: { type: 'property', property: 'margin-left' },
        matchers: [{ type: 'key', keys: ['ml'] }]
      },
      {
        id: 'margin-right',
        name: 'mr:',
        type: -1,
        emit: { type: 'property', property: 'margin-right' },
        matchers: [{ type: 'key', keys: ['mr'] }]
      }
    ]
  }))
  expect(lint.analyze(['block', 'm:2px', 'm:3px', 'unknown'], undefined, [])).toEqual({
    version: 1,
    sortedClassNames: ['block', 'm:2px', 'm:3px', 'unknown'],
    conflicts: [{ className: 'm:2px', conflicts: ['m:3px'] }],
    partialConflicts: []
  })
  expect(lint.analyze(['mx:2px', 'ml:3px'], undefined, [])).toEqual({
    version: 1,
    sortedClassNames: ['ml:3px', 'mx:2px'],
    conflicts: [],
    partialConflicts: [{ className: 'mx:2px', replacement: 'mr:2px', conflict: 'ml:3px' }]
  })
  expect(lint.canonicalClassNames(['margin:md'], [true], undefined)).toEqual({
    version: 1,
    suggestions: [{ className: 'margin:md', recommended: 'm:md' }]
  })
  expect(lint.canonicalClassGroups(['ml:md', 'mr:md'], undefined, undefined)).toEqual({
    version: 1,
    suggestions: [{ classNames: ['ml:md', 'mr:md'], recommended: 'mx:md' }]
  })
  expect(lint.canonicalComposeDirective(['contain:content'], [true], undefined)).toEqual({
    version: 1,
    suggestions: [{
      actual: 'contain:content',
      recommended: 'contain: content',
      classNames: ['contain:content'],
      kind: 'native-declaration'
    }],
    structuralChange: true,
    replacement: 'contain: content;'
  })
  expect(lint.rawValueCandidates(['m:md|17px'], undefined, [])).toEqual({
    version: 1,
    candidates: [
      { className: 'm:md|17px', key: 'm', segments: ['17px'], properties: ['margin'] }
    ]
  })
  expect(lint.analyzeClassList('mx:2px  ml:3px', ['mx:2px', 'ml:3px'], undefined, [])).toEqual({
    version: 1,
    analysis: {
      version: 1,
      sortedClassNames: ['ml:3px', 'mx:2px'],
      conflicts: [],
      partialConflicts: [{ className: 'mx:2px', replacement: 'mr:2px', conflict: 'ml:3px' }]
    },
    diagnostics: [
      {
        ruleId: 'sort-classes',
        code: 'invalid-class-order',
        message: 'Sort classes into the expected order: "ml:3px mx:2px".',
        range: { start: 0, end: 14 },
        data: { actual: 'mx:2px ml:3px', expected: 'ml:3px mx:2px' },
        fix: { range: { start: 0, end: 14 }, text: 'ml:3px  mx:2px', scope: 'class-list' }
      },
      {
        ruleId: 'no-conflicting-classes',
        code: 'partially-conflicting-class',
        message: 'Replace "mx:2px" with "mr:2px"; later class "ml:3px" overrides part of "mx:2px".',
        range: { start: 0, end: 6 },
        data: { actual: 'mx:2px', replacement: 'mr:2px', conflict: 'ml:3px' },
        fix: { range: { start: 0, end: 14 }, text: 'mr:2px  ml:3px', scope: 'class-list' }
      }
    ],
    sortEdit: { range: { start: 0, end: 14 }, text: 'ml:3px  mx:2px', scope: 'class-list' },
    conflictEdit: { range: { start: 0, end: 14 }, text: 'mr:2px  ml:3px', scope: 'class-list' },
    conflictRange: { start: 0, end: 6 }
  })
  const policy = lint.analyzeClassListPolicy(JSON.stringify({
    version: 1,
    classList: 'block unknown',
    classNames: ['block', 'unknown'],
    validationErrors: [
      ['Invalid value for `display` property'],
      []
    ],
    disallowUnknownClass: true
  })) as { diagnostics: unknown[] }
  expect(policy.diagnostics).toEqual([
    expect.objectContaining({
      ruleId: 'no-invalid-classes',
      code: 'invalid-class',
      range: { start: 0, end: 5 }
    }),
    expect.objectContaining({
      ruleId: 'no-invalid-classes',
      code: 'unknown-class',
      range: { start: 6, end: 13 }
    })
  ])
  const rawPolicy = lint.analyzeClassListPolicy(JSON.stringify({
    version: 1,
    classList: '😀 m:md|17px',
    classNames: ['😀', 'm:md|17px'],
    rawValuePolicy: {
      allowedPatterns: []
    }
  })) as { diagnostics: unknown[] }
  expect(rawPolicy.diagnostics).toContainEqual({
    ruleId: 'no-unapproved-raw-values',
    code: 'unapproved-raw-value',
    message: 'Raw value "17px" is not approved for class "m:md|17px". Use a token or allow the value explicitly.',
    range: { start: 3, end: 12 },
    data: {
      className: 'm:md|17px',
      value: '17px',
      key: 'm',
      properties: ['margin']
    }
  })
  lint.dispose()
  lint.free()

  const language = new tooling.ToolingLanguageSession(JSON.stringify({
    version: 1,
    utilities: [{
      id: 'display-block',
      name: 'block',
      type: -2,
      emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
      matchers: [{ type: 'static', name: 'block' }]
    }]
  }))
  expect(language.classifyClassNames(['block:hover', 'unknown'], [])).toMatchObject({
    version: 1,
    classes: [
      { className: 'block:hover', kind: 'semantic', stateToken: ':hover' },
      { className: 'unknown', kind: 'unknown' }
    ]
  })
  expect(language.inspectClassName('block:hover', [])).toMatchObject({
    version: 1,
    className: 'block:hover',
    kind: 'semantic',
    text: '@layer utilities{.block\\:hover:hover{display:block}}'
  })
  expect(language.completionIndex()).toMatchObject({
    version: 1,
    classEntries: expect.arrayContaining([
      expect.objectContaining({ label: 'block', kind: 'value' }),
      expect.objectContaining({ label: 'fg:', kind: 'property', triggerSuggest: true })
    ])
  })
  expect(language.colorPresentation('rgba(0|0|0/.5)')).toEqual({
    version: 1,
    colorToken: 'rgba(0|0|0/.5)',
    space: 'srgb'
  })
  expect(language.colorTokens([{ className: 'color:#123', start: 2 }])).toEqual({
    version: 1,
    tokens: [{ range: { start: 8, end: 12 }, value: '#123' }]
  })
  language.dispose()
  language.free()

  expect(tooling.createInspectionReport({
    version: 1,
    cwd: '/project',
    patterns: ['index.html'],
    files: [],
    classes: ['missing'],
    scanner: {},
    stylesheets: {},
    css: { text: '😀' }
  })).toMatchObject({
    version: 1,
    css: { bytes: 2, included: false },
    missingCSS: {
      missing: [{ className: 'missing', reason: 'not-detected' }]
    },
    summary: { errors: 1, missingCSS: 1 }
  })
})
