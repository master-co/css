import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createBuilder, type Rolldown } from 'vite'
import { describe, expect, it } from 'vitest'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { defaultBuildManifest } from '@master/css-internal/project'
import { createStylesheetCollection } from '@master/css-compiler/stylesheet'
import masterCSS from '../../src/core'
import EmittedGlobalsVirtualModulePlugin, { type EmittedGlobalsPluginAPI } from '../../src/plugins/emitted-globals-virtual-module'
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

  it('lets an adapter finalize the emittedGlobals each build environment carries', async () => {
    const parent = join(process.cwd(), 'tmp')
    mkdirSync(parent, { recursive: true })
    const root = realpathSync(mkdtempSync(join(parent, 'emitted-globals-environments-')))
    try {
      writeFileSync(join(root, 'style.css'), "@import '@master/css';.card{color:var(--color-text-body)}")
      writeFileSync(join(root, 'server.js'), 'import "./style.css";export const page = "card"')
      writeFileSync(join(root, 'client.js'), 'export { default } from "virtual:master-css-emitted-globals"')
      const plugins = masterCSS({ mode: 'runtime' })
      const api = plugins.find(plugin => plugin.name === 'master-css:virtual-module:emitted-globals')!.api as EmittedGlobalsPluginAPI
      const finalized: Record<string, unknown> = {}
      api.finalize = (environment, emittedGlobals) => {
        finalized[environment.name] = emittedGlobals
        return environment.name === 'client' ? finalized.ssr as typeof emittedGlobals : emittedGlobals
      }
      const outputs: Record<string, Rolldown.RolldownOutput> = {}
      // Builder environments resolve separate configurations, as in Astro.
      const builder = await createBuilder({
        root, configFile: false, logLevel: 'silent', plugins,
        environments: {
          ssr: { build: { ssr: true, emitAssets: true, write: false, rolldownOptions: { input: join(root, 'server.js') } } },
          client: { build: { write: false, minify: false, rolldownOptions: { input: join(root, 'client.js') } } }
        },
        builder: {
          async buildApp(builder) {
            for (const name of ['ssr', 'client']) outputs[name] = await builder.build(builder.environments[name]) as Rolldown.RolldownOutput
          }
        }
      })
      await builder.buildApp()

      expect(Object.keys(finalized)).toEqual(['ssr', 'client'])
      expect(finalized.client).toMatchObject({ variables: {} })
      expect(finalized.ssr).toMatchObject({ variables: { 'color-text-body': 1 } })
      const client = outputs.client.output.find(chunk => chunk.type === 'chunk')!.code
      expect(JSON.parse(JSON.parse(client.match(/JSON\.parse\(("(?:[^"\\]|\\.)*")\)/)![1]))).toEqual(finalized.ssr)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
