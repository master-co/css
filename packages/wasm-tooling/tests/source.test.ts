import { readFile } from 'node:fs/promises'
import { expect, test } from 'vitest'
import { initToolingWasm } from '../src'

test('loads the isolated source tooling Wasm surface', async () => {
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_wasm_tooling_bg.wasm',
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
        fix: { range: { start: 0, end: 14 }, text: 'ml:3px  mx:2px' }
      },
      {
        ruleId: 'no-conflicting-classes',
        code: 'partially-conflicting-class',
        message: 'Replace "mx:2px" with "mr:2px"; later class "ml:3px" overrides part of "mx:2px".',
        range: { start: 0, end: 6 },
        data: { actual: 'mx:2px', replacement: 'mr:2px', conflict: 'ml:3px' },
        fix: { range: { start: 0, end: 14 }, text: 'mr:2px  ml:3px' }
      }
    ],
    sortEdit: { range: { start: 0, end: 14 }, text: 'ml:3px  mx:2px' },
    conflictEdit: { range: { start: 0, end: 14 }, text: 'mr:2px  ml:3px' },
    conflictRange: { start: 0, end: 6 }
  })
  lint.dispose()
  lint.free()

  expect(tooling.analyzeLanguage(
    '😀 fg:red\nnext',
    [{ start: 3, end: 9 }],
    [{ start: 3, end: 9, type: 'property', modifiers: ['declaration'] }]
  )).toEqual({
    version: 1,
    classPositions: [{
      range: { start: 3, end: 9 },
      contextRange: { start: 3, end: 9 },
      raw: 'fg:red',
      token: 'fg:red'
    }],
    semanticTokenData: [0, 3, 6, 2, 1]
  })

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
