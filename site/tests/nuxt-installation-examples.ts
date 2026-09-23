import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { planMasterCSSSetup, applyMasterCSSSetupPlan } from '../../packages/create/dist/index.js'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const nuxtInstallationModes = ['progressive', 'runtime', 'static'] as const
export type NuxtInstallationMode = typeof nuxtInstallationModes[number]

/** Build the authored Nuxt 4 files with installed workspace packages. No network
 * installation, synthetic HTML renderer or replacement CSS compiler is used.
 */
export function nuxtInstallationFixture(mode: NuxtInstallationMode) {
  mkdirSync(join(repository, 'tmp'), { recursive: true })
  const root = mkdtempSync(join(repository, 'tmp/master-nuxt-doc-'))
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  try {
    write('package.json', JSON.stringify({ private: true, type: 'module', dependencies: { nuxt: '4.5.2', vue: '3.5.42' }, scripts: { dev: 'nuxt dev', build: 'nuxt build' } }))
    write('nuxt.config.ts', 'export default defineNuxtConfig({})\n')
    const plan = planMasterCSSSetup({ root, framework: 'nuxt', mode: mode === 'progressive' ? undefined : mode, install: false })
    applyMasterCSSSetupPlan(plan, { install: false })
    const installed = readFileSync(join(root, 'nuxt.config.ts'), 'utf8')
    assert.match(installed, /@master\/css-nuxt/)
    if (mode !== 'progressive') assert.ok(installed.includes(`mode: '${mode}'`))
    assert.match(readFileSync(join(root, 'assets/css/master.css'), 'utf8'), /@import '@master\/css'/)
    const route = '/nuxtjs' + (mode === 'progressive' ? '' : `/${mode}-rendering`)
    const source = installationSource(route)
    const fences = deliveryFences(source)
    for (const name of ['nuxt.config.ts', 'assets/css/master.css', 'app/app.vue']) {
      const found = fences.find(fence => fence.name === name)
      assert.ok(found, `${route}: ${name}`)
      const lines = found.text.trimEnd().split('\n')
      const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
      write(name, lines.map(line => line.slice(indent)).join('\n') + '\n')
    }
    assert.ok(source.includes(`npm create @master/css@rc -- --framework nuxt${mode === 'progressive' ? '' : ` --mode ${mode}`} --yes`))
    for (const name of ['nuxt', 'vue', '@master/css', '@master/css-nuxt', '@master/css-runtime']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      const packageRoot = name.startsWith('@master/') ? 'node_modules' : 'packages/nuxt/node_modules'
      symlinkSync(realpathSync(join(repository, packageRoot, name)), destination, 'dir')
    }
    const bin = join(root, 'node_modules/nuxt/bin/nuxt.mjs')
    const built = spawnSync(process.execPath, [bin, 'build'], { cwd: root, encoding: 'utf8', timeout: 120000, env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' } })
    assert.equal(built.status, 0, `${mode}: ${built.stderr}\n${built.stdout}`)
    const assets = readdirSync(join(root, '.output/public'), { recursive: true }).filter((file): file is string => typeof file === 'string')
    const css = assets.filter(name => name.endsWith('.css')).map(name => readFileSync(join(root, '.output/public', name), 'utf8')).join('\n')
    if (mode === 'static') {
      assert.match(css, /font-style:\s?italic/)
      assert.ok(!assets.some(name => name.endsWith('.wasm')))
    } else assert.doesNotMatch(css, /font-style:\s?italic/)
    return { root, bin: join(root, '.output/server/index.mjs'), dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyNuxtInstallationExamples() {
  for (const mode of nuxtInstallationModes) nuxtInstallationFixture(mode).dispose()
}
