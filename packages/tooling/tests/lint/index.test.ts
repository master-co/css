import { beforeAll, describe, expect, it } from 'vitest'
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
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
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
      const result = lint.analyzeLintClassList('fg:red block fg:blue unknown', [
        'fg:red', 'block', 'fg:blue', 'unknown'
      ], { disallowUnknownClass: true })
      expect(result.diagnostics.map(({ ruleId }) => ruleId)).toEqual(expect.arrayContaining([
        'sort-classes',
        'no-conflicting-classes',
        'no-invalid-classes'
      ]))
      expect(result.diagnostics.find(({ ruleId }) => ruleId === 'sort-classes')?.fix?.text)
        .not.toBe('fg:red block fg:blue unknown')
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
      const classList = 'font:16px w:md h:md'
      const classNames = lint.tokenizeClassList(classList).map(({ token }) => token)
      const result = lint.analyzeLintClassList(classList, classNames, { canonicalOptions: {} })
      const diagnostics = result.diagnostics.filter(({ ruleId }) => ruleId === 'prefer-canonical-classes')
      expect(diagnostics.length).toBeGreaterThan(0)
      expect(diagnostics.every(({ fix }) => fix?.scope === 'class-list')).toBe(true)
    } finally {
      lint.dispose()
    }
  })

  it('lints and fixes source files without a TypeScript engine', () => {
    const lintSession = createTestToolingSession(createPresetManifest())
    const options = {
      content: '<div class="fg:red block fg:blue"></div>',
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
