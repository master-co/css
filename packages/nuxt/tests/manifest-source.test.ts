import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { nuxtCtx } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { afterEach, expect, it } from 'vitest'
import { VIRTUAL_MANIFEST_ID } from '@master/css-internal/manifest-module'
import { RESOLVED_VIRTUAL_PROGRAM_ID } from '@master/css-internal/program-module'
import { createEngineSync } from '@master/css/node'
import masterCSSNuxtModule from '../src/module'

let projectDir: string | undefined

afterEach(() => {
  if (projectDir) rmSync(projectDir, { recursive: true, force: true })
  projectDir = undefined
})

// Runs module setup without building Nuxt and returns the manifest it wires for
// Nitro and the program it wires for the client runtime.
async function setupRuntimeInputs(dev: boolean) {
  projectDir ??= mkdtempSync(join(tmpdir(), 'master-css-nuxt-manifest-source-'))
  writeFileSync(join(projectDir, 'app.css'), '@import "@master/css";\n@utility card { display: block; }\n@keyframes fade { to { opacity: 0; } }')
  const hooks: Record<string, ((...args: any[]) => unknown)[]> = {}
  const nuxt = {
    options: { ssr: true, dev, rootDir: projectDir, app: { baseURL: '/', head: {} }, build: { transpile: [] }, plugins: [] },
    hook(name: string, fn: (...args: any[]) => unknown) {
      (hooks[name] ??= []).push(fn)
    }
  } as unknown as Nuxt
  nuxtCtx.set(nuxt)
  try {
    await masterCSSNuxtModule({ mode: 'runtime' }, nuxt)
  } finally {
    nuxtCtx.unset()
  }
  const nitro: { virtual?: Record<string, string>, publicAssets?: { dir: string, baseURL: string }[] } = {}
  for (const hook of hooks['nitro:config'] ?? []) await hook(nitro)
  const serverURL = nitro.virtual?.[VIRTUAL_MANIFEST_ID]?.match(/new URL\("([^"]+)"\)/)?.[1]
  if (!serverURL) throw new Error('Expected the Nitro manifest module to read a file.')
  const serverFile = fileURLToPath(serverURL)
  const href = (nuxt.options.app.head.link as { href: string }[])[0]!.href
  const publicAsset = nitro.publicAssets!.find(asset => href === `${asset.baseURL}${basename(href)}`)!
  const vite = { plugins: [] as any[] }
  for (const hook of hooks['vite:extendConfig'] ?? []) await hook(vite)
  const plugin = vite.plugins.find(plugin => plugin.name === 'master-css:nuxt-runtime-inputs')
  plugin.configResolved({ command: dev ? 'serve' : 'build' })
  return {
    serverFile,
    clientFile: join(publicAsset.dir, basename(href)),
    clientHref: href,
    clientModule: await plugin.load.call({ addWatchFile() {} }, RESOLVED_VIRTUAL_PROGRAM_ID) as string
  }
}

async function importProgram(code: string) {
  return (await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`) as { default: Uint8Array }).default
}

it('omits source provenance only from production inputs shared by Nitro and the client', async () => {
  const development = await setupRuntimeInputs(true)
  expect(readFileSync(development.serverFile, 'utf8')).toMatch(/"source":\{"file":"[^"]*app\.css"/)
  const developmentProgram = await importProgram(development.clientModule)
  expect(Buffer.from(developmentProgram).includes('app.css')).toBe(true)

  const production = await setupRuntimeInputs(false)
  expect(dirname(production.serverFile)).toBe(dirname(development.serverFile))
  const json = readFileSync(production.serverFile, 'utf8')
  expect(json).toContain('"name":"card"')
  expect(json).not.toContain('"source"')
  expect(production.clientHref).toMatch(/^\/_master-css\/program\/master-css-program\.[0-9a-f]{8}\.bin$/)
  expect(production.clientModule).toContain(JSON.stringify(production.clientHref))
  const program = new Uint8Array(readFileSync(production.clientFile))
  expect(Buffer.from(program).includes(projectDir!)).toBe(false)
  using engine = createEngineSync({ program })
  expect(engine.ensureClassRules(['card']).mutations.length).toBeGreaterThan(0)
})
