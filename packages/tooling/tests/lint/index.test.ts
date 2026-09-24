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
        'fg-red', 'block', 'fg-blue', 'unknown'
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

  it('owns canonical recommendations while the wrapper only maps host diagnostics', () => {
    const lint = createTestToolingSession(createPresetManifest())
    try {
      const classList = 'margin-md'
      const classNames = lint.tokenizeClassList(classList).map(({ token }) => token)
      const result = lint.analyzeLintClassList(classList, classNames, { canonicalOptions: {} })
      const diagnostics = result.diagnostics.filter(({ ruleId }) => ruleId === 'prefer-canonical-classes')
      expect(diagnostics.length).toBeGreaterThan(0)
      expect(diagnostics.every(({ fix }) => fix?.scope === 'class-list')).toBe(true)
    } finally {
      lint.dispose()
    }
  })

  it('ignores token, static, invalid, unknown, and component classes', () => {
    const lint = createTestToolingSession(createPresetManifest({
      utilities: [{ name: 'btn', layer: 'components', declarations: { display: 'block' } }]
    }))
    try {
      expect(lint.rawValueCandidates([
        'font-md',
        'm-md',
        'm:var(--spacing-md)|var(--spacing-lg)',
        'fg-red-60',
        'text-center',
        'font:16px',
        'unknown-class',
        'btn'
      ])).toEqual([])
    } finally {
      lint.dispose()
    }
  })

  it('suggests property aliases without replacing literals or changing priority', () => {
    const lint = createTestToolingSession(createPresetManifest())
    try {
      expect(lint.canonicalClassNames([
        'text-align:center:hover@sm',
        'font-size:16px',
        'margin-md'
      ])).toEqual([
        { className: 'margin-md', recommended: 'm-md' }
      ])
    } finally {
      lint.dispose()
    }
  })

  it('keeps native values and only shortens equivalent property names', () => {
    const lint = createTestToolingSession(createPresetManifest())
    try {
      expect(lint.canonicalClassNames([
        'position:relative',
        'display:none',
        'visibility:hidden',
        'height:100vh',
        'width:100vw',
        'aspect-ratio:1/1'
      ])).toEqual([
        { className: 'height:100vh', recommended: 'h:100vh' },
        { className: 'width:100vw', recommended: 'w:100vw' }
      ])
    } finally {
      lint.dispose()
    }
  })

  it('lints and fixes source files without a TypeScript engine', () => {
    const lintSession = createTestToolingSession(createPresetManifest())
    const options = {
      content: '<div class="fg-red block fg-blue"></div>',
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
