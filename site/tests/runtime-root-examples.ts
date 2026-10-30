import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { build } from 'vite'
import masterCSS from '@master/css-vite'
import { deliveryFences } from './delivery-examples'
import { installationSource } from './installation-examples'
import { workspaceDependency } from './workspace-dependency'

/** Exercise the authored bootstrap without index.html injection. This checks
 * Vite client/SSR boundaries, not the separate framework CLI or routing build.
 */
export async function verifyRuntimeRootExamples() {
  for (const [route, entry, stylesheet] of [
    ['/react-router/runtime', 'app/root.tsx', 'app/app.css'],
    ['/tanstack-start/runtime', 'src/routes/__root.tsx', 'src/styles/app.css']
  ]) {
    const root = mkdtempSync(join(tmpdir(), 'master-doc-runtime-root-'))
    const write = (file: string, value: string) => {
      mkdirSync(dirname(join(root, file)), { recursive: true })
      writeFileSync(join(root, file), value)
    }
    try {
      write('package.json', '{"private":true,"type":"module"}')
      const source = deliveryFences(installationSource(route)).find(fence => fence.name === entry)
      assert.ok(source, `${route}: authored root bootstrap`)
      write(entry, source.text)
      write(stylesheet, "@import '@master/css';\n")
      for (const name of ['@master/css', '@master/css-runtime']) {
        const destination = join(root, 'node_modules', name)
        mkdirSync(dirname(destination), { recursive: true })
        symlinkSync(workspaceDependency(name), destination, 'dir')
      }
      const files = (directory: string) => readdirSync(join(root, directory), { recursive: true }).filter((file): file is string => typeof file === 'string')
      await build({ root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode: 'runtime' })], build: { outDir: 'client', rollupOptions: { input: entry } } })
      const clientFiles = files('client')
      assert.ok(clientFiles.some(file => /master-css-program.*\.bin$/.test(file)), `${route}: client program emitted without an HTML transform`)
      const client = clientFiles.filter(file => file.endsWith('.js')).map(file => readFileSync(join(root, 'client', file), 'utf8')).join('\n')
      assert.match(client, /master-css-program/, `${route}: client startup references its program`)

      await build({ root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode: 'runtime' })], build: { ssr: entry, outDir: 'server' } })
      const serverFiles = files('server')
      assert.ok(!serverFiles.some(file => file.endsWith('.bin')), `${route}: SSR has no runtime program`)
      const server = serverFiles.filter(file => file.endsWith('.js')).map(file => readFileSync(join(root, 'server', file), 'utf8')).join('\n')
      assert.doesNotMatch(server, /master-css-runtime|master-css-program|virtual:/, `${route}: browser startup is removed from SSR`)
    } finally { rmSync(root, { recursive: true, force: true }) }
  }
}
