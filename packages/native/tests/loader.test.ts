import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import {
  assertNativeCLIInfo,
  getNativeCLIExecutableName,
  loadNativeBinding,
  NativeBindingError,
  nativeAddonsDisabled,
  resolveNativeCLIPath,
  resolveNativeTarget
} from '../src'

describe('native target resolution', () => {
  it('resolves the eight Tier-1 packages', () => {
    expect(resolveNativeTarget('darwin', 'arm64')?.packageName).toBe('@master/css-native-darwin-arm64')
    expect(resolveNativeTarget('darwin', 'x64')?.packageName).toBe('@master/css-native-darwin-x64')
    expect(resolveNativeTarget('win32', 'arm64')?.packageName).toBe('@master/css-native-win32-arm64-msvc')
    expect(resolveNativeTarget('win32', 'x64')?.packageName).toBe('@master/css-native-win32-x64-msvc')
    expect(resolveNativeTarget('linux', 'arm64', 'glibc')?.packageName).toBe('@master/css-native-linux-arm64-gnu')
    expect(resolveNativeTarget('linux', 'arm64', 'musl')?.packageName).toBe('@master/css-native-linux-arm64-musl')
    expect(resolveNativeTarget('linux', 'x64', 'glibc')?.packageName).toBe('@master/css-native-linux-x64-gnu')
    expect(resolveNativeTarget('linux', 'x64', 'musl')?.packageName).toBe('@master/css-native-linux-x64-musl')
  })

  it('leaves unsupported targets to the Wasm fallback', () => {
    expect(resolveNativeTarget('linux', 'arm', 'glibc')).toBeUndefined()
    expect(resolveNativeTarget('freebsd', 'x64')).toBeUndefined()
  })

  it('recognizes the Node addon kill switch', () => {
    expect(nativeAddonsDisabled(['--no-addons'])).toBe(true)
    expect(nativeAddonsDisabled([])).toBe(false)
  })

  it('uses platform-specific native executable names', () => {
    expect(getNativeCLIExecutableName('darwin')).toBe('mcss')
    expect(getNativeCLIExecutableName('linux')).toBe('mcss')
    expect(getNativeCLIExecutableName('win32')).toBe('mcss.exe')
  })

  it('validates native executable ABI metadata', () => {
    const executable = resolve(__dirname, '../artifacts/mcss')
    expect(assertNativeCLIInfo(executable)).toMatchObject({
      bindingAbiVersion: 1,
      packageVersion: '0.0.0',
      manifestVersion: 1,
      hydrationManifestVersion: 1
    })
  })

  it('rejects a configured missing executable without falling back', () => {
    expect(() => resolveNativeCLIPath({ executablePath: '/missing/master-css/mcss' }))
      .toThrowError(expect.objectContaining<Partial<NativeBindingError>>({ code: 'NATIVE_LOAD_FAILED' }))
  })

  it('rejects unsupported lint request versions with a structured error', () => {
    const loaded = loadNativeBinding({ required: true })!
    const lint = new loaded.binding.LintSession('{"version":1,"utilities":[]}')
    try {
      expect(() => lint.analyzeClassListPolicy(JSON.stringify({
        version: 0,
        classList: 'unknown',
        classNames: ['unknown']
      }))).toThrow('INVALID_LINT_REQUEST')
    } finally {
      lint.dispose()
    }
  })

  it('loads raw value policy candidates and diagnostics', () => {
    const loaded = loadNativeBinding({ required: true })!
    const lint = new loaded.binding.LintSession(JSON.stringify({
      version: 1,
      variables: {
        spacing: [{ key: 'md', type: 'number', value: '1rem' }]
      },
      utilities: [{
        id: 'margin',
        name: 'm:',
        type: -1,
        variableAliasRefs: ['~spacing'],
        emit: { type: 'property', property: 'margin' },
        matchers: [{ type: 'key', keys: ['m'] }]
      }]
    }))
    try {
      expect(JSON.parse(lint.canonicalClassNames(['margin:md'], [true]))).toEqual({
        version: 1,
        suggestions: [{ className: 'margin:md', recommended: 'm:md' }]
      })
      expect(JSON.parse(lint.rawValueCandidates(['m:md|17px'], undefined, []))).toEqual({
        version: 1,
        candidates: [
          { className: 'm:md|17px', key: 'm', segments: ['17px'], properties: ['margin'] }
        ]
      })
      const result = JSON.parse(lint.analyzeClassListPolicy(JSON.stringify({
        version: 1,
        classList: 'm:md|17px',
        classNames: ['m:md|17px'],
        rawValuePolicy: { approvedSegments: [[false]] }
      })))
      expect(result.diagnostics).toContainEqual(expect.objectContaining({
        ruleId: 'no-unapproved-raw-values',
        code: 'unapproved-raw-value',
        range: { start: 0, end: 9 }
      }))
    } finally {
      lint.dispose()
    }
  })

  it('loads the manifest-driven language session', () => {
    const loaded = loadNativeBinding({ required: true })!
    const language = new loaded.binding.LanguageSession(JSON.stringify({
      version: 1,
      utilities: [{
        id: 'display-block',
        name: 'block',
        type: -2,
        emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
        matchers: [{ type: 'static', name: 'block' }]
      }]
    }))
    try {
      expect(JSON.parse(language.classifyClassNames(['block:hover', 'unknown']))).toMatchObject({
        version: 1,
        classes: [
          { className: 'block:hover', kind: 'semantic', stateToken: ':hover' },
          { className: 'unknown', kind: 'unknown' }
        ]
      })
      expect(JSON.parse(language.inspectClassName('block:hover'))).toMatchObject({
        version: 1,
        className: 'block:hover',
        kind: 'semantic',
        text: '@layer utilities{.block\\:hover:hover{display:block}}'
      })
      expect(JSON.parse(language.completionIndex())).toMatchObject({
        version: 1,
        classEntries: expect.arrayContaining([
          expect.objectContaining({ label: 'block', kind: 'value' }),
          expect.objectContaining({ label: 'fg:', kind: 'property', triggerSuggest: true })
        ])
      })
      expect(JSON.parse(language.colorPresentation('rgba(0|0|0/.5)'))).toEqual({
        version: 1,
        colorToken: 'rgba(0|0|0/.5)',
        space: 'srgb'
      })
      expect(JSON.parse(language.colorTokens(JSON.stringify([{
        className: 'color:#123',
        start: 2
      }])))).toEqual({
        version: 1,
        tokens: [{ range: { start: 8, end: 12 }, value: '#123' }]
      })
    } finally {
      language.dispose()
    }
  })
})
