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
    "const classes = \"block margin-inline:auto\"; import value from \"ignored\""
  )).toEqual(['block', "margin-inline:auto"])
  expect(tooling.extractHTMLClasses(
    'index.html',
    "<main class=\"display:grid\"><script>const classes = \"fg-red\"</script></main>"
  )).toEqual(["display:grid", 'fg-red'])

  const scanner = new tooling.ToolingScannerSession(JSON.stringify({
  "version": 4 as const,
  "languageVersion": 7 as const,
  "mixins": [
    {
      "name": "--block",
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
  "version": 4 as const,
  "languageVersion": 7 as const,
  "mixins": [
    {
      "name": "--block",
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
}))
  expect(validator.generateClasses(['block', 'unknown'])).toMatchObject({
    version: 4 as const,
    classes: [
      { className: 'block', matchStatus: 'matched', rules: [{ text: '.block{display:block}' }] },
      { className: 'unknown', matchStatus: 'unmatched', rules: [] }
    ]
  })
  validator.dispose()
  validator.free()

  const lint = new tooling.ToolingLintSession(JSON.stringify({
  "theme": [
    {
      "type": "rule" as const,
      "prelude": ":root,:host",
      "children": [
        {
          "type": "declaration" as const,
          "name": "spacing-md",
          "value": "1rem"
        }
      ]
    }
  ],
  "version": 4 as const,
  "languageVersion": 7 as const,
  "variables": {
    "spacing": [
      {
        "key": "md",
        "type": "number" as const,
        "values": [
          {
            "path": [
              ":root,:host"
            ],
            "value": "1rem"
          }
        ]
      }
    ]
  },
  "mixins": [
    {
      "name": "--block",
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
    },
    {
      "name": "--mx",
      "parameters": [
        {
          "name": "--value"
        }
      ],
      "body": [
        {
          "type": "declaration" as const,
          "property": "margin-inline",
          "value": [
            {
              "type": "function" as const,
              "name": "var",
              "value": [
                {
                  "type": "text" as const,
                  "value": "--value"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}))
  expect(lint.analyze(['block', "margin:2px", "margin:3px", 'unknown'], undefined, [])).toEqual({
    version: 3 as const,
    sortedClassNames: ['block', "margin:2px", "margin:3px", 'unknown'],
    conflicts: [{ className: "margin:2px", conflicts: ["margin:3px"] }],
    partialConflicts: []
  })
  expect(lint.analyze(["margin-inline:2px", "margin-inline-start:3px"], undefined, [])).toEqual({
    version: 3 as const,
    sortedClassNames: ["margin-inline:2px", "margin-inline-start:3px"],
    conflicts: [],
    partialConflicts: []
  })
  expect(lint.canonicalClassNames(['margin-md'], [true], undefined)).toEqual({
    version: 3 as const,
    suggestions: [{ className: 'margin-md', recommended: 'm-md' }]
  })
  expect(lint.canonicalClassGroups(['mxs-md', 'mxe-md'], undefined, undefined)).toEqual({
    version: 3 as const,
    suggestions: []
  })
  expect(lint.rawValueCandidates(["margin:var(--spacing-md)|17px"], undefined, [])).toEqual({
    version: 3 as const,
    candidates: [
      { className: "margin:var(--spacing-md)|17px", key: 'margin', segments: ['17px'], properties: ['margin'] }
    ]
  })
  // Decomposing a shorthand would change its cascade tier, so no partial autofix.
  expect(lint.analyzeClassList("margin-inline:2px  margin-inline-start:3px", ["margin-inline:2px", "margin-inline-start:3px"], undefined, [])).toEqual({
    version: 3 as const,
    analysis: { version: 3 as const, sortedClassNames: ["margin-inline:2px", "margin-inline-start:3px"], conflicts: [], partialConflicts: [] },
    diagnostics: []
  })
  const policy = lint.analyzeClassListPolicy(JSON.stringify({
    version: 3 as const,
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
    version: 3 as const,
    classList: "😀 margin:var(--spacing-md)|17px",
    classNames: ['😀', "margin:var(--spacing-md)|17px"],
    rawValuePolicy: {
      allowedPatterns: []
    }
  })) as { diagnostics: unknown[] }
  expect(rawPolicy.diagnostics).toContainEqual({
    ruleId: 'no-unapproved-raw-values',
    code: 'unapproved-raw-value',
    message: "Raw value \"17px\" is not approved for class \"margin:var(--spacing-md)|17px\". Use a token or allow the value explicitly.",
    range: { start: 3, end: 32 },
    data: {
      className: "margin:var(--spacing-md)|17px",
      value: '17px',
      key: 'margin',
      properties: ['margin']
    }
  })
  lint.dispose()
  lint.free()

  const language = new tooling.ToolingLanguageSession(JSON.stringify({
  "version": 4 as const,
  "languageVersion": 7 as const,
  "mixins": [
    {
      "name": "--block",
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
}))
  expect(language.classifyClassNames(['block:hover', 'unknown'], [])).toMatchObject({
    version: 5 as const,
    classes: [
      { className: 'block:hover', kind: 'semantic', stateToken: ':hover' },
      { className: 'unknown', kind: 'unknown' }
    ]
  })
  expect(language.inspectClassName('block:hover', [])).toMatchObject({
    version: 5 as const,
    className: 'block:hover',
    kind: 'semantic',
    text: '@layer utilities{.block\\:hover:hover{display:block}}'
  })
  expect(language.completionIndex()).toMatchObject({
    version: 5 as const,
    classEntries: expect.arrayContaining([
      expect.objectContaining({ label: 'block', kind: 'value' }),
      expect.objectContaining({ label: "color:", kind: 'property', triggerSuggest: true })
    ])
  })
  expect(language.colorPresentation('rgba(0|0|0/.5)')).toEqual({
    version: 5 as const,
    colorToken: 'rgba(0|0|0/.5)',
    editable: true,
    sourceFormat: { syntax: 'rgb' as const }
  })
  expect(language.colorTokens([{ className: 'color:#123', start: 2 }])).toEqual({
    version: 5 as const,
    tokens: [{
      range: { start: 8, end: 12 },
      expression: { kind: 'literal', value: '#123' }
    }]
  })
  language.dispose()
  language.free()

  expect(tooling.createInspectionReport({
    version: 5 as const,
    cwd: '/project',
    patterns: ['index.html'],
    files: [],
    classes: ['missing'],
    scanner: {},
    stylesheets: {},
    css: { text: '😀' }
  })).toMatchObject({
    version: 5 as const,
    // UTF-8 bytes, not UTF-16 code units: '😀' is four bytes, which is the
    // contract mastercss-diagnostics tests as reports_utf8_css_bytes.
    css: { bytes: 4, included: false },
    missingCSS: {
      missing: [{ className: 'missing', reason: 'not-detected' }]
    },
    summary: { errors: 1, missingCSS: 1 }
  })
})
