import { readFile, stat } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import FastGlob from 'fast-glob'
import { init, parse } from 'es-module-lexer'
import { transformWithOxc, type Plugin } from 'vite'

const siteRoot = fileURLToPath(new URL('..', import.meta.url))
const proxyPrefix = '\0site-island:'
const originalQuery = '?site-island-original'
const registryId = 'virtual:site-islands'
const resolvedRegistryId = '\0' + registryId
const serverRuntime = fileURLToPath(new URL('./server.tsx', import.meta.url))
const sourcePattern = /\.[cm]?[jt]sx?$/
const directivePattern = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*(['"])use client\1/
const ignore = ['**/node_modules/**', 'out/**', '.astro/**', '.generated/**', 'tests/**', '**/*.test.*', 'scripts/**', 'islands/**']
const directiveCache = new Map<string, { mtimeMs: number, client: boolean }>()

export function cleanId(id: string) {
  return id.replace(/[?#].*$/, '')
}

export function hasClientDirective(source: string) {
  return directivePattern.test(source)
}

export async function isClientModule(file: string) {
  if (!sourcePattern.test(file) || !file.startsWith(siteRoot) || file.includes(`${sep}node_modules${sep}`)) return false
  const { mtimeMs } = await stat(file).catch(() => ({ mtimeMs: -1 }))
  if (mtimeMs < 0) return false
  const cached = directiveCache.get(file)
  if (cached?.mtimeMs === mtimeMs) return cached.client
  const client = hasClientDirective(await readFile(file, 'utf8'))
  directiveCache.set(file, { mtimeMs, client })
  return client
}

export function islandId(file: string) {
  return relative(siteRoot, file).split(sep).join('/')
}

async function exportNames(file: string) {
  await init
  const { code } = await transformWithOxc(await readFile(file, 'utf8'), file, { jsx: { runtime: 'automatic' } })
  return [...new Set(parse(code)[1].flatMap((entry) => 'name' in entry && !entry.typeOnly ? [entry.name] : []))]
}

async function listClientModules() {
  const files = await FastGlob('**/*.{ts,tsx,js,jsx}', { cwd: siteRoot, absolute: true, ignore })
  const modules: string[] = []
  for (const file of files.sort()) {
    if (await isClientModule(resolve(file))) modules.push(resolve(file))
  }
  return modules
}

/**
 * Gives `'use client'` modules React Server Component semantics on Astro: server
 * imports receive client references, and the browser registry hydrates them.
 */
export default function siteIslands(): Plugin {
  return {
    name: 'master-css-site:islands',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source === registryId) return resolvedRegistryId
      if (this.environment.config.consumer !== 'server') return
      if (source.startsWith(proxyPrefix) || source.endsWith(originalQuery)) return
      if (importer?.startsWith(proxyPrefix)) return
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (!resolved || resolved.external) return
      const file = cleanId(resolved.id)
      if (file === resolved.id && await isClientModule(file)) return proxyPrefix + file
    },
    async load(id) {
      if (id === resolvedRegistryId) {
        const modules = await listClientModules()
        return `export default {\n${modules.map((file) => `  ${JSON.stringify(islandId(file))}: () => import(${JSON.stringify(file)}),`).join('\n')}\n}\n`
      }
      if (!id.startsWith(proxyPrefix)) return
      const file = id.slice(proxyPrefix.length)
      this.addWatchFile(file)
      const names = await exportNames(file)
      const moduleId = JSON.stringify(islandId(file))
      return [
        `import * as module from ${JSON.stringify(file + originalQuery)}`,
        `import { clientReference } from ${JSON.stringify(serverRuntime)}`,
        ...names.map((name) => name === 'default'
          ? `export default clientReference(module.default, ${moduleId}, 'default')`
          : `export const ${name} = clientReference(module.${name}, ${moduleId}, ${JSON.stringify(name)})`)
      ].join('\n')
    }
  }
}
