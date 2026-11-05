import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import createMasterCSSVitePlugin from '../../src/core'

test('allows a closed Vite child compiler to inspect route exports without scanning again', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-vite-closed-route-'))
  const source = 'export const loader = () => null; export default function Route() { return <p className="p-md">Probe</p> }'
  await writeFile(join(root, 'route.tsx'), source)
  // React Router uses a separate child compiler to inspect SSR route exports.
  // It drops the server hooks and can still transform a route after closing it.
  const plugins = createMasterCSSVitePlugin().map(plugin => ({ ...plugin, configureServer: undefined, configurePreviewServer: undefined }))
  const server = await createServer({ root, plugins, configFile: false, logLevel: 'silent',
    server: { middlewareMode: true, watch: null, hmr: false, preTransformRequests: false } })
  try {
    await server.pluginContainer.buildStart({})
    const route = '/route.tsx'
    const id = (await server.pluginContainer.resolveId(route, undefined, { ssr: true }))!.id
    await server.moduleGraph.ensureEntryFromUrl(route, true)
    const transform = () => server.pluginContainer.transform(source, id, { ssr: true })
    const active = await transform()
    expect(active.code).toContain('loader')
    expect(active.code).toContain('p-md')
    await server.close()
    expect((await transform()).code).toBe(active.code)
  } finally {
    await server.close()
    await rm(root, { recursive: true, force: true })
  }
})
