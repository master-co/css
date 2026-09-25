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
    '<main class="grid"><script>const classes = "fg-red"</script></main>'
  )).toEqual(['grid', 'fg-red'])

  const scanner = new tooling.ToolingScannerSession(JSON.stringify({
    version: 1, languageVersion: 2,
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
    version: 1, languageVersion: 2,
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
    version: 3,
    classes: [
      { className: 'block', matchStatus: 'matched', rules: [{ text: '.block{display:block}' }] },
      { className: 'unknown', matchStatus: 'unmatched', rules: [] }
    ]
  })
  validator.dispose()
  validator.free()

  const lint = new tooling.ToolingLintSession(JSON.stringify({
    version: 1, languageVersion: 2,
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
          declarations: { 'margin-inline': null }
        },
        matchers: [{ type: 'key', keys: ['mx'] }]
      },
      {
        id: 'margin-inline-start',
        name: 'mxs:',
        type: -1,
        emit: { type: 'property', property: 'margin-inline-start' },
        matchers: [{ type: 'key', keys: ['mxs'] }]
      },
      {
        id: 'margin-inline-end',
        name: 'mxe:',
        type: -1,
        emit: { type: 'property', property: 'margin-inline-end' },
        matchers: [{ type: 'key', keys: ['mxe'] }]
      }
    ]
  }))
  expect(lint.analyze(['block', 'm:2px', 'm:3px', 'unknown'], undefined, [])).toEqual({
    version: 1,
    sortedClassNames: ['block', 'm:2px', 'm:3px', 'unknown'],
    conflicts: [{ className: 'm:2px', conflicts: ['m:3px'] }],
    partialConflicts: []
  })
  expect(lint.analyze(['mx:2px', 'mxs:3px'], undefined, [])).toEqual({
    version: 1,
    sortedClassNames: ['mx:2px', 'mxs:3px'],
    conflicts: [],
    partialConflicts: []
  })
  expect(lint.canonicalClassNames(['margin-md'], [true], undefined)).toEqual({
    version: 1,
    suggestions: [{ className: 'margin-md', recommended: 'm-md' }]
  })
  expect(lint.canonicalClassGroups(['mxs-md', 'mxe-md'], undefined, undefined)).toEqual({
    version: 1,
    suggestions: []
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
  expect(lint.rawValueCandidates(['m:var(--spacing-md)|17px'], undefined, [])).toEqual({
    version: 1,
    candidates: [
      { className: 'm:var(--spacing-md)|17px', key: 'm', segments: ['17px'], properties: ['margin'] }
    ]
  })
  // Decomposing a shorthand would change its cascade tier, so no partial autofix.
  expect(lint.analyzeClassList('mx:2px  mxs:3px', ['mx:2px', 'mxs:3px'], undefined, [])).toEqual({
    version: 1,
    analysis: { version: 1, sortedClassNames: ['mx:2px', 'mxs:3px'], conflicts: [], partialConflicts: [] },
    diagnostics: []
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
    classList: '😀 m:var(--spacing-md)|17px',
    classNames: ['😀', 'm:var(--spacing-md)|17px'],
    rawValuePolicy: {
      allowedPatterns: []
    }
  })) as { diagnostics: unknown[] }
  expect(rawPolicy.diagnostics).toContainEqual({
    ruleId: 'no-unapproved-raw-values',
    code: 'unapproved-raw-value',
    message: 'Raw value "17px" is not approved for class "m:var(--spacing-md)|17px". Use a token or allow the value explicitly.',
    range: { start: 3, end: 27 },
    data: {
      className: 'm:var(--spacing-md)|17px',
      value: '17px',
      key: 'm',
      properties: ['margin']
    }
  })
  lint.dispose()
  lint.free()

  const language = new tooling.ToolingLanguageSession(JSON.stringify({
    version: 1, languageVersion: 2,
    utilities: [{
      id: 'display-block',
      name: 'block',
      type: -2,
      emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
      matchers: [{ type: 'static', name: 'block' }]
    }]
  }))
  expect(language.classifyClassNames(['block:hover', 'unknown'], [])).toMatchObject({
    version: 4,
    classes: [
      { className: 'block:hover', kind: 'semantic', stateToken: ':hover' },
      { className: 'unknown', kind: 'unknown' }
    ]
  })
  expect(language.inspectClassName('block:hover', [])).toMatchObject({
    version: 4,
    className: 'block:hover',
    kind: 'semantic',
    text: '@layer utilities{.block\\:hover:hover{display:block}}'
  })
  expect(language.completionIndex()).toMatchObject({
    version: 4,
    classEntries: expect.arrayContaining([
      expect.objectContaining({ label: 'block', kind: 'value' }),
      expect.objectContaining({ label: 'fg:', kind: 'property', triggerSuggest: true })
    ])
  })
  expect(language.colorPresentation('rgba(0|0|0/.5)')).toEqual({
    version: 4,
    colorToken: 'rgba(0|0|0/.5)',
    editable: true,
    sourceFormat: { syntax: 'rgb' }
  })
  expect(language.colorTokens([{ className: 'color:#123', start: 2 }])).toEqual({
    version: 4,
    tokens: [{
      range: { start: 8, end: 12 },
      expression: { kind: 'literal', value: '#123' }
    }]
  })
  language.dispose()
  language.free()

  expect(tooling.createInspectionReport({
    version: 3,
    cwd: '/project',
    patterns: ['index.html'],
    files: [],
    classes: ['missing'],
    scanner: {},
    stylesheets: {},
    css: { text: '😀' }
  })).toMatchObject({
    version: 3,
    // UTF-8 bytes, not UTF-16 code units: '😀' is four bytes, which is the
    // contract mastercss-diagnostics tests as reports_utf8_css_bytes.
    css: { bytes: 4, included: false },
    missingCSS: {
      missing: [{ className: 'missing', reason: 'not-detected' }]
    },
    summary: { errors: 1, missingCSS: 1 }
  })
})
