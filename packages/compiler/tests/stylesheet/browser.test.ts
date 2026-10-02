import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { contentsManifest as defaultManifestJSON } from '../helpers/contents-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { compileBrowserStylesheet } from '../../src/stylesheet/browser'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

describe('@master/css-compiler/stylesheet/browser', () => {
  it('renders class names with the compiled manifest', async () => {
    const result = await compileBrowserStylesheet("\n      @mixin --btn {\n          @apply --all {display:flex;}\n          color: red;\n        } @utility btn {\n          @apply --all {display:flex;}\n          color: red;\n        }\n    ", {
      baseManifest: defaultManifest,
      classNames: ['btn']
    })

    expect(result.css).toContain('.btn')
    expect(result.css).toContain('display:flex')
    expect(result.css).toContain('color:red')
    expect(result.generatedCSS).toContain('.btn')
    expect(result.nativeCSS).toBe('')
  })

  it('uses one explicit compiler artifact for compilation and rendering', async () => {
    const input = new Uint8Array(await readFile(new URL(
      '../../../binding-wasm-compiler/artifacts/mastercss_binding_wasm_compiler_bg.wasm',
      import.meta.url
    )))
    const result = await compileBrowserStylesheet(' @mixin --card { display: block; } @utility card { display: block; } ', {
      baseManifest: defaultManifest,
      classNames: ['card'],
      binding: { input }
    })

    expect(result.css).toContain('.card{display:block}')
  })

  it('preserves native CSS while rendering class names', async () => {
    const result = await compileBrowserStylesheet(`
      @theme {
        --color-card: #ffffff;
      }

      .native {
        color: var(--color-card);
      }
    `, {
      baseManifest: defaultManifest,
      classNames: ["display:block"]
    })

    expect(result.css).toMatch(/\.native\s*\{\s*color:\s*var\(--color-card\);\s*\}/)
    expect(result.css).toContain(".display\\:block{display:block}")
    expect(result.css).toContain('--color-card:#fff')
  })

  it('emits variables referenced by native CSS without class names', async () => {
    const result = await compileBrowserStylesheet(`
      @theme {
        --color-card: #ffffff;
      }

      .native {
        color: var(--color-card);
      }
    `, {
      baseManifest: defaultManifest
    })

    expect(result.css).toMatch(/\.native\s*\{\s*color:\s*var\(--color-card\);\s*\}/)
    expect(result.css).toContain('--color-card:#fff')
    expect(result.emittedGlobals.variables).toEqual({
      'color-card': 1
    })
  })

  it('emits managed keyframes referenced by native animation declarations', async () => {
    const result = await compileBrowserStylesheet('.native { animation: fade 1s; }', {
      baseManifest: defaultManifest
    })

    expect(result.css).toMatch(/\.native\s*\{\s*animation:\s*(?:fade 1s|1s fade);\s*\}/)
    expect(result.css).toContain('@keyframes fade')
    expect(result.css).not.toContain('@keyframes rotate')
    expect(result.emittedGlobals.keyframes).toEqual({ [result.manifest.keyframes!.find(frame => frame.name === 'fade')!.id]: 1 })
  })

  it('preserves same-name native definitions alongside preset definitions', async () => {
    const result = await compileBrowserStylesheet('@keyframes fade { to { opacity: .5; } }', { baseManifest: defaultManifest })
    expect(result.manifest.keyframes!.filter(frame => frame.name === 'fade')).toHaveLength(2)
    expect(result.nativeCSS).toContain('@keyframes fade')
  })

  it('reports dynamic native animation roots as information while retaining all managed definitions', async () => {
    const result = await compileBrowserStylesheet('.native { animation-name: var(--external); }', {
      baseManifest: defaultManifest,
      from: 'dynamic.css'
    })
    expect(Object.keys(result.emittedGlobals.keyframes)).toHaveLength(10)
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DYNAMIC_ANIMATION_NAMES', severity: 'information' })
    ]))
  })

  it('rejects undefined theme modes with a structured diagnostic', async () => {
    await expect(compileBrowserStylesheet('@theme custom { --color-warning-test: #ff0033; }', {
      baseManifest: defaultManifest
    })).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([expect.objectContaining({ severity: 'error', message: expect.stringContaining('accepts only static and inline modifiers') })])
    })
  })
})
