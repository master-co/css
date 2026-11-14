import { readFileSync } from 'node:fs'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { describe, expect, it } from 'vitest'
import { createCompilerBindingSessionSync, MasterCSSManifestReference, shareManifest } from '../src/compiler-binding-node'
import { createRenderBindingSessionSync } from '../src/engine-binding-node'

const preset = JSON.parse(readFileSync(new URL('../../preset/src/default-manifest.json', import.meta.url), 'utf8')) as MasterCSSManifest

const request = (css: string) => ({
  graph: { entry: '/entry.css', files: { '/entry.css': css }, edges: [] },
  urls: { '/entry.css': 'file:///entry.css' },
  options: { preserveNativeCSS: true }
})

function render(manifest: MasterCSSManifest | MasterCSSManifestReference, css: string) {
  using session = createRenderBindingSessionSync({ manifest })
  session.ensureStylesheetResources(css)
  session.ensureClassRules(['block', 'fg-stone-60'])
  return session.snapshot()
}

describe('manifest references', () => {
  it('compile and render like the manifests they stand for', () => {
    using compiler = createCompilerBindingSessionSync()
    for (const css of [
      '.a { color: var(--color-stone-60) }',
      '@utility card { padding: 1rem }\n.b { --motion: fade 1s; animation: var(--motion) }\n@keyframes fade { to { opacity: 0 } }'
    ]) {
      const inline = compiler.compileCSSStylesheetGraph({ ...request(css), baseManifest: preset })
      const referenced = compiler.compileCSSStylesheetGraphWithReferences({ ...request(css), baseManifest: preset })
      expect(referenced.manifest).toBeInstanceOf(MasterCSSManifestReference)
      expect(referenced.stylesheets).toEqual(inline.stylesheets)
      expect(referenced.directives).toEqual(inline.directives)
      expect(referenced.manifest.manifest()).toEqual(inline.manifest)
      expect(referenced.resolutionManifest.manifest()).toEqual(inline.resolutionManifest)
      expect(Object.isFrozen(referenced.resolutionManifest.manifest())).toBe(true)

      // A reference renders without reading its manifest into JavaScript.
      const fresh = compiler.compileCSSStylesheetGraphWithReferences({ ...request(css), baseManifest: preset })
      const nativeCSS = inline.stylesheets.map(sheet => sheet.css).join('\n')
      expect(render(fresh.resolutionManifest, nativeCSS)).toEqual(render(inline.resolutionManifest, nativeCSS))

      // References pass back as inputs.
      const again = compiler.compileCSSStylesheetGraphWithReferences({ ...request(css), baseManifest: referenced.manifest, resolutionManifest: referenced.resolutionManifest })
      const inlineAgain = compiler.compileCSSStylesheetGraph({ ...request(css), baseManifest: inline.manifest, resolutionManifest: inline.resolutionManifest })
      expect(again.manifest.manifest()).toEqual(inlineAgain.manifest)
    }
  })

  it('keeps one reference for a shared manifest', () => {
    using compiler = createCompilerBindingSessionSync()
    const shared = shareManifest(structuredClone(preset))
    const first = compiler.compileCSSStylesheetGraphWithReferences({ ...request('.a{}'), baseManifest: shared })
    const second = compiler.compileCSSStylesheetGraphWithReferences({ ...request('.b{}'), baseManifest: shared })
    // An identical lowering returns the same reference, so its manifest is read once.
    expect(second.manifest).toBe(first.manifest)
    expect(first.manifest.manifest()).toEqual(compiler.compileCSSStylesheetGraph({ ...request('.a{}'), baseManifest: preset }).manifest)
  })
})
