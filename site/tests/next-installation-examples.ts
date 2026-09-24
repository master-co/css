import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { planMasterCSSSetup, applyMasterCSSSetupPlan } from '../../packages/create/dist/index.js'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const nextInstallationModes = ['progressive', 'runtime', 'static'] as const
export type NextInstallationMode = typeof nextInstallationModes[number]
function dependency(name: string) {
  if (name === 'next') return realpathSync(join(repository, 'site/node_modules/next'))
  if (name.startsWith('@master/')) return realpathSync(join(repository, 'node_modules', name))
  const store = join(repository, 'node_modules/.pnpm')
  const version = name === 'typescript' ? '6.' : ''
  const entry = readdirSync(store).find(entry => entry.startsWith(name.replace('/', '+') + '@' + version))
  assert.ok(entry, `Missing installed dependency: ${name}`)
  return join(store, entry, 'node_modules', name)
}

/** The scratch app stays under the workspace so Turbopack can resolve linked
 * packages within its filesystem boundary. Only fixture worker count is added
 * to the authored Next configuration. No packages are installed or modified.
 */
export function nextInstallationFixture(mode: NextInstallationMode) {
  mkdirSync(join(repository, 'tmp'), { recursive: true })
  const root = mkdtempSync(join(repository, 'tmp/master-next-doc-'))
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  try {
    write('package.json', JSON.stringify({ private: true, type: 'module', dependencies: { next: '16.3.4', react: '19.2.8', 'react-dom': '19.2.8' }, scripts: { dev: 'next dev', build: 'next build', start: 'next start' } }))
    write('next.config.ts', "import type { NextConfig } from 'next'\nconst nextConfig: NextConfig = {}\nexport default nextConfig\n")
    const plan = planMasterCSSSetup({ root, framework: 'nextjs', mode: mode === 'progressive' ? undefined : mode, install: false })
    applyMasterCSSSetupPlan(plan, { install: false })
    const installed = readFileSync(join(root, 'next.config.ts'), 'utf8')
    assert.match(installed, /import withMasterCSS from '@master\/css-next'/)
    assert.ok(installed.includes(mode === 'progressive' ? 'withMasterCSS(nextConfig)' : `${mode === 'static' ? 'await ' : ''}withMasterCSS(nextConfig, { mode: '${mode}' })`))
    assert.match(readFileSync(join(root, 'app/globals.css'), 'utf8'), /@import '@master\/css'/)
    const route = '/nextjs' + (mode === 'progressive' ? '' : `/${mode}-rendering`)
    const source = installationSource(route)
    const fences = deliveryFences(source)
    for (const name of ['next.config.ts', 'app/globals.css', 'app/layout.tsx', 'app/page.tsx']) {
      const found = fences.find(fence => fence.name === name)
      assert.ok(found, `${route}: ${name}`)
      const lines = found.text.trimEnd().split('\n')
      const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
      let text = lines.map(line => line.slice(indent)).join('\n') + '\n'
      if (name === 'next.config.ts') text = text.replace('const nextConfig: NextConfig = {}', 'const nextConfig: NextConfig = { experimental: { cpus: 2 } }')
      write(name, text)
    }
    assert.ok(source.includes(`npm create @master/css@rc -- --framework nextjs${mode === 'progressive' ? '' : ` --mode ${mode}`} --yes`))
    // Additional route verifies the documented request-time delivery boundary.
    write('app/dynamic/page.tsx', "import { connection } from 'next/server'\nexport default async function DynamicPage() {\n  await connection()\n  return <h1 className=\"m-md italic font-3xl font-heavy text:strong\">Request-time heading</h1>\n}\n")
    for (const name of ['next', 'react', 'react-dom', 'typescript', '@types/react', '@types/react-dom', '@types/node', '@master/css', '@master/css-next', '@master/css-runtime']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(dependency(name), destination, 'dir')
    }
    const bin = join(root, 'node_modules/next/dist/bin/next')
    const built = spawnSync(process.execPath, [bin, 'build'], { cwd: root, encoding: 'utf8', timeout: 120000, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } })
    assert.equal(built.status, 0, `${mode}: ${built.stderr}\n${built.stdout}`)
    const html = readFileSync(join(root, '.next/server/app/index.html'), 'utf8')
    assert.match(html, /Hello World/)
    const assets = readdirSync(join(root, '.next/static'), { recursive: true }).filter((file): file is string => typeof file === 'string')
    const css = assets.filter(name => name.endsWith('.css')).map(name => readFileSync(join(root, '.next/static', name), 'utf8')).join('\n')
    if (mode !== 'runtime') assert.match(html + css, /font-style:\s?italic/)
    else assert.doesNotMatch(html + css, /font-style:\s?italic/)
    if (mode === 'static') assert.ok(!assets.some(name => name.endsWith('.wasm')))
    return { root, bin, dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyNextInstallationExamples() {
  for (const mode of nextInstallationModes) nextInstallationFixture(mode).dispose()
}
