import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { createCompiler } from '../src'
import { createCompilerSync } from '../src/node'

interface CompilerParityCase {
  id: string
  source: string
  baseManifest: 'default' | MasterCSSManifest
  expectedGeneratedCss?: string
  expectedManifest?: MasterCSSManifest
  expectedError?: string
  expectedUtilities?: MasterCSSManifest['utilities']
}

interface SemanticParityCorpus {
  version: 2
  compilerCases: CompilerParityCase[]
}

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const semanticParityCorpus = JSON.parse(readFileSync(
  new URL('../../../parity/rust-semantic-corpus.json', import.meta.url),
  'utf8'
)) as SemanticParityCorpus

test('native compiler sessions batch semantic operations and reject use after disposal', () => {
  const compiler = createCompilerSync()
  const inspected = compiler.inspectCSS('@master entry;')
  const compiled = compiler.compileCSS('@master entry;\n@utilities { btn { display: block; } }')

  expect(compiler.binding).toBe('native')
  expect(inspected.hasMasterEntry).toBe(true)
  expect(compiled.diagnostics).toEqual([])
  expect(Object.keys(compiled)).not.toContain('styleDefinitions')
  compiler.dispose()
  compiler.dispose()
  expect(() => compiler.inspectCSS('')).toThrowError(expect.objectContaining({
    code: 'SESSION_DISPOSED'
  }))
})

test('native and Wasm compiler sessions execute the semantic compiler corpus', async () => {
  expect(semanticParityCorpus.version).toBe(2)

  const native = createCompilerSync()
  const wasm = await createCompiler({ binding: 'wasm' })
  try {
    for (const parityCase of semanticParityCorpus.compilerCases) {
      const baseManifest = parityCase.baseManifest === 'default'
        ? defaultManifest
        : parityCase.baseManifest
      const options = {
        baseManifest,
        from: `parity/${parityCase.id}.css`
      }

      if (parityCase.expectedError) {
        expect(() => native.compileManifest(parityCase.source, options), parityCase.id)
          .toThrow(parityCase.expectedError)
        expect(() => wasm.compileManifest(parityCase.source, options), parityCase.id)
          .toThrow(parityCase.expectedError)
        continue
      }

      const nativeResult = native.compileManifest(parityCase.source, options)
      const wasmResult = wasm.compileManifest(parityCase.source, options)
      expect(wasmResult, `${parityCase.id}: Wasm result`).toEqual(nativeResult)
      if (parityCase.expectedGeneratedCss !== undefined) {
        expect(nativeResult.generatedCSS, parityCase.id).toBe(parityCase.expectedGeneratedCss)
      }
      if (parityCase.expectedManifest) {
        expect(nativeResult.manifest, parityCase.id).toEqual(parityCase.expectedManifest)
      }
      for (const expectedUtility of parityCase.expectedUtilities ?? []) {
        expect(
          nativeResult.manifest.utilities?.find(({ name }) => name === expectedUtility.name),
          `${parityCase.id}: utility ${expectedUtility.name}`
        ).toEqual(expectedUtility)
      }
    }
  } finally {
    native.dispose()
    wasm.dispose()
  }
})
