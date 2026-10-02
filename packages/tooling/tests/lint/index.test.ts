import { beforeAll, describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import {
  defaultCanonicalClassNameOptions,
  defaultClassLintSettings,
  defaultMasterCSSLintRules,
  fixMasterCSSContent,
  lintMasterCSSContent
} from '../../src/lint'
import { createTestToolingSession } from '../helpers/create-tooling-session'
import { createPresetManifest } from './helpers/create-preset-manifest'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(
    new URL('../../../binding/artifacts/mastercss.node', import.meta.url)
  )
})

describe('Rust lint session', () => {
  it('publishes frozen default settings', () => {
    expect(Object.isFrozen(defaultClassLintSettings)).toBe(true)
    expect(Object.isFrozen(defaultClassLintSettings.classAttributes)).toBe(true)
    expect(Object.isFrozen(defaultCanonicalClassNameOptions)).toBe(true)
    expect(Object.isFrozen(defaultMasterCSSLintRules)).toBe(true)
  })

  it('owns sort, conflict, validation, and edit policy', () => {
    const lint = createTestToolingSession(createPresetManifest())
    try {
      const result = lint.analyzeLintClassList('fg-red block fg-blue unknown', [
        'fg-red', "display:block", 'fg-blue', 'unknown'
      ], { disallowUnknownClass: true })
      expect(result.diagnostics.map(({ ruleId }) => ruleId)).toEqual(expect.arrayContaining([
        'sort-classes',
        'no-conflicting-classes',
        'no-invalid-classes'
      ]))
      expect(result.diagnostics.find(({ ruleId }) => ruleId === 'sort-classes')?.fix?.text)
        .not.toBe('fg-red block fg-blue unknown')
      expect(Object.isFrozen(result)).toBe(true)
      expect(Object.isFrozen(result.diagnostics)).toBe(true)
      expect(Object.isFrozen(result.diagnostics[0].range)).toBe(true)
    } finally {
      lint.dispose()
    }
  })

  it('diagnoses retired tokens without offering an alias autofix', () => {
    const lint = createTestToolingSession(createPresetManifest())
    try {
      const classList = 'margin-md'
      const classNames = lint.tokenizeClassList(classList).map(({ token }) => token)
      const result = lint.analyzeLintClassList(classList, classNames, { canonicalOptions: {} })
      const diagnostics = result.diagnostics.filter(({ ruleId }) => ruleId === 'no-invalid-classes')
      expect(diagnostics.length).toBeGreaterThan(0)
      expect(diagnostics.every(({ fix }) => !fix)).toBe(true)
    } finally {
      lint.dispose()
    }
  })

  it('ignores token, static, invalid, unknown, and component classes', () => {
    const lint = createTestToolingSession(createPresetManifest({
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
    try {
      expect(lint.rawValueCandidates([
        'font-size-md',
        'm-md',
        "margin:var(--spacing-md)|var(--spacing-lg)",
        'fg-red-60',
        "text-align:center",
        'font:16px',
        'unknown-class',
        'btn'
      ])).toEqual([])
    } finally {
      lint.dispose()
    }
  })

  it('does not restore retired property token spellings through recommendations', () => {
    const lint = createTestToolingSession(createPresetManifest())
    try {
      expect(lint.canonicalClassNames([
        'text-align:center:hover@sm',
        'font-size:16px',
        'margin-md'
      ])).toEqual([])
    } finally {
      lint.dispose()
    }
  })

  it('keeps full native declarations without alias recommendations', () => {
    const lint = createTestToolingSession(createPresetManifest())
    try {
      expect(lint.canonicalClassNames([
        'position:relative',
        'display:none',
        'visibility:hidden',
        'height:100vh',
        'width:100vw',
        'aspect-ratio:1/1'
      ])).toEqual([])
    } finally {
      lint.dispose()
    }
  })

  it('lints and fixes source files without a TypeScript engine', () => {
    const lintSession = createTestToolingSession(createPresetManifest())
    const options = {
      content: '<div class="fg-red display:block fg-blue"></div>',
      filePath: '/workspace/index.html',
      lintSession
    }
    try {
      const result = lintMasterCSSContent(options)
      expect(result.diagnostics.some(({ ruleId }) => ruleId === 'no-conflicting-classes')).toBe(true)
      expect(fixMasterCSSContent(options)).not.toBe(options.content)
    } finally {
      lintSession.dispose()
    }
  })
})

it('does not autofix entity-decoded MDX class lists using decoded offsets', () => {
  const session = createTestToolingSession(createPresetManifest())
  try {
    const content = "<div className=\"padding:2px&#32;flex\" />"
    const options = { content, filePath: 'page.mdx', lintSession: session }
    expect(fixMasterCSSContent(options)).toBe(content)
    const diagnostics = lintMasterCSSContent(options).diagnostics
    expect(diagnostics.every(item => !item.fixes?.length)).toBe(true)
    expect(diagnostics.every(item => item.range.end <= content.length)).toBe(true)
  } finally { session.dispose() }
})
