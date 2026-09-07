import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import {
  assertMasterCSSBindingInfo,
  MASTER_CSS_BINDING_ABI_VERSION
} from '../src'
import {
  assertNativeCLIInfo,
  getNativeCLIExecutableName,
  NativeBindingError,
  nativeAddonsDisabled,
  loadNativeBinding,
  resolveNativeCLIPath,
  resolveNativeTarget
} from '../src/native-loader'
import { createNativeEngineSession } from '../src/engine-browser'
import { loadNativeToolingBinding } from '../src/tooling'

describe('native target resolution', () => {
  it('resolves the eight Tier-1 packages', () => {
    expect(resolveNativeTarget('darwin', 'arm64')?.packageName).toBe('@master/css-binding-darwin-arm64')
    expect(resolveNativeTarget('darwin', 'x64')?.packageName).toBe('@master/css-binding-darwin-x64')
    expect(resolveNativeTarget('win32', 'arm64')?.packageName).toBe('@master/css-binding-win32-arm64-msvc')
    expect(resolveNativeTarget('win32', 'x64')?.packageName).toBe('@master/css-binding-win32-x64-msvc')
    expect(resolveNativeTarget('linux', 'arm64', 'glibc')?.packageName).toBe('@master/css-binding-linux-arm64-gnu')
    expect(resolveNativeTarget('linux', 'arm64', 'musl')?.packageName).toBe('@master/css-binding-linux-arm64-musl')
    expect(resolveNativeTarget('linux', 'x64', 'glibc')?.packageName).toBe('@master/css-binding-linux-x64-gnu')
    expect(resolveNativeTarget('linux', 'x64', 'musl')?.packageName).toBe('@master/css-binding-linux-x64-musl')
  })

  it('leaves unsupported targets to the Wasm fallback', () => {
    expect(resolveNativeTarget('linux', 'arm', 'glibc')).toBeUndefined()
    expect(resolveNativeTarget('freebsd', 'x64')).toBeUndefined()
  })

  it('recognizes the Node addon kill switch', () => {
    expect(nativeAddonsDisabled(['--no-addons'])).toBe(true)
    expect(nativeAddonsDisabled([])).toBe(false)
  })

  it('keeps the browser loader error contract aligned with the Node entry', () => {
    expect(() => createNativeEngineSession({
      manifest: { version: 1 } as never
    }, { required: true })).toThrowError(expect.objectContaining({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'binding'
    }))
  })

  it('uses platform-specific native executable names', () => {
    expect(getNativeCLIExecutableName('darwin')).toBe('mcss')
    expect(getNativeCLIExecutableName('linux')).toBe('mcss')
    expect(getNativeCLIExecutableName('win32')).toBe('mcss.exe')
  })

  it('validates native executable ABI metadata', () => {
    const executable = resolve(__dirname, '../artifacts/mcss')
    expect(assertNativeCLIInfo(executable)).toMatchObject({
      bindingAbiVersion: MASTER_CSS_BINDING_ABI_VERSION,
      packageVersion: '0.0.0',
      manifestVersion: 1,
      hydrationManifestVersion: 1
    })
  })

  it('reuses the loaded native binding for the same resolved artifact', () => {
    const first = loadNativeBinding({ required: true })
    const second = loadNativeBinding({ required: true })

    expect(first).toBe(second)
  })

  it('rejects binding ABI 5 metadata after the engine surface expansion', () => {
    const info = loadNativeBinding({ required: true })!.info
    expect(() => assertMasterCSSBindingInfo({
      ...info,
      bindingAbiVersion: 5
    }, {
      surface: 'native',
      features: ['engine']
    })).toThrow('contract mismatch')
  })

  it('rejects a configured missing executable without falling back', () => {
    expect(() => resolveNativeCLIPath({ executablePath: '/missing/master-css/mcss' }))
      .toThrowError(expect.objectContaining<Partial<NativeBindingError>>({ code: 'NATIVE_LOAD_FAILED' }))
  })

  it('rejects unsupported lint request versions with a structured error', () => {
    const lint = loadNativeToolingBinding({ required: true })!
      .createLintSession({ version: 1, utilities: [] } as never)
    try {
      expect(() => lint.analyzeClassListPolicy({
        version: 0,
        classList: 'unknown',
        classNames: ['unknown']
      } as never)).toThrow('INVALID_LINT_REQUEST')
    } finally {
      lint.dispose()
    }
  })

  it('loads raw value policy candidates and diagnostics', () => {
    const lint = loadNativeToolingBinding({ required: true })!.createLintSession({
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
    } as never)
    try {
      expect(lint.canonicalClassNames(['margin:md'], [true])).toEqual({
        version: 1,
        suggestions: [{ className: 'margin:md', recommended: 'm:md' }]
      })
      expect(lint.rawValueCandidates(['m:md|17px'], undefined, [])).toEqual({
        version: 1,
        candidates: [
          { className: 'm:md|17px', key: 'm', segments: ['17px'], properties: ['margin'] }
        ]
      })
      const result = lint.analyzeClassListPolicy({
        version: 1,
        classList: 'm:md|17px',
        classNames: ['m:md|17px'],
        rawValuePolicy: { allowedPatterns: [] }
      }) as { diagnostics: unknown[] }
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
    const language = loadNativeToolingBinding({ required: true })!.createLanguageSession({
      version: 1,
      utilities: [{
        id: 'display-block',
        name: 'block',
        type: -2,
        emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
        matchers: [{ type: 'static', name: 'block' }]
      }]
    } as never)
    try {
      expect(language.classifyClassNames(['block:hover', 'unknown'])).toMatchObject({
        version: 2,
        classes: [
          { className: 'block:hover', kind: 'semantic', stateToken: ':hover' },
          { className: 'unknown', kind: 'unknown' }
        ]
      })
      expect(language.inspectClassName('block:hover')).toMatchObject({
        version: 2,
        className: 'block:hover',
        kind: 'semantic',
        text: '@layer utilities{.block\\:hover:hover{display:block}}'
      })
      expect(language.completionIndex()).toMatchObject({
        version: 2,
        classEntries: expect.arrayContaining([
          expect.objectContaining({ label: 'block', kind: 'value' }),
          expect.objectContaining({ label: 'fg:', kind: 'property', triggerSuggest: true })
        ])
      })
      expect(language.colorPresentation('rgba(0|0|0/.5)')).toEqual({
        version: 2,
        colorToken: 'rgba(0|0|0/.5)',
        sourceFormat: { syntax: 'rgb' }
      })
      expect(language.colorTokens([{
        className: 'color:#123',
        start: 2
      }])).toEqual({
        version: 2,
        tokens: [{
          range: { start: 8, end: 12 },
          expression: { kind: 'literal', value: '#123' }
        }]
      })
    } finally {
      language.dispose()
    }
  })
})
