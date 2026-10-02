import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { defaultBuildManifest } from '@master/css-internal/project'
import { createStylesheetCollection } from '@master/css-compiler/stylesheet'
import EmittedGlobalsVirtualModulePlugin from '../../src/plugins/emitted-globals-virtual-module'
import { RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID, VIRTUAL_EMITTED_GLOBALS_ID } from '../../src/common'

function parseDefaultExport(code: string) {
  return JSON.parse(code.replace(/^export default /, '').replace(/;$/, ''))
}

describe('EmittedGlobalsVirtualModulePlugin', () => {
  it('loads emittedGlobals counts from the managed CSS entry output', async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-vite-emittedGlobals-'))
    try {
      mkdirSync(join(root, 'app'), { recursive: true })
      const scanner = new MasterCSSScanner({ manifest: defaultBuildManifest }, root)
      await scanner.init()
      const stylesheets = createStylesheetCollection()
      await stylesheets.register(scanner, join(root, 'app/globals.css'), `
        @theme {
          --color-primary: #ff0000;
        }

        @prune native;@theme {  }@keyframes fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .main {
          color: var(--color-primary);
          animation-name: fade;
        }
      `, {
        baseManifest: defaultBuildManifest,
        projectDir: root
      })
      await scanner.scan(join(root, 'app/page.tsx'), '<main class="main"></main>')

      const context = {
        config: { root },
        scanner,
        stylesheets,
        includeGeneratedCSS: false
      } as any
      const plugin = EmittedGlobalsVirtualModulePlugin(context)

      await expect((plugin.resolveId as any)(VIRTUAL_EMITTED_GLOBALS_ID)).resolves.toBe(RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID)
      const code = await (plugin.load as any)(RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID)

      const globals = parseDefaultExport(code)
      expect(globals.variables).toEqual({ 'color-primary': 1 })
      expect(Object.values(globals.keyframes)).toEqual([1, 1])
      expect(globals.keyframeSlots).toHaveLength(1)
      expect(globals.keyframes[globals.keyframeSlots[0]]).toBe(1)
      expect(globals.suppressedKeyframes).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
