import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const root = mkdtempSync(join(tmpdir(), 'vite-pure-resource-paths-'))
const rows = [], svg = '<svg xmlns="http://www.w3.org/2000/svg"><title>pure</title></svg>'
let server
try {
  writeFileSync(join(root, 'index.html'), '<!doctype html><title>fallback</title>')
  for (const name of ['pixel.svg', 'pixel space.svg', 'pixel#part.svg', 'pixel?query.svg', 'pixel%value.svg']) writeFileSync(join(root, name), svg)
  server = await createServer({ root, configFile: false, logLevel: 'silent', server: { host: '127.0.0.1', port: 0 } })
  await server.listen()
  for (const name of ['pixel.svg', 'pixel space.svg', 'pixel#part.svg', 'pixel?query.svg', 'pixel%value.svg']) {
    const response = await fetch(new URL(encodeURIComponent(name) + '?variant=1', server.resolvedUrls.local[0]))
    const body = await response.text()
    const row = { name, status: response.status, mime: response.headers.get('content-type'), exactBytes: body === svg, body }
    rows.push(row);console.log(JSON.stringify(row))
  }
} finally {
  await server?.environments.client.waitForRequestsIdle()
  await server?.close();rmSync(root, { recursive: true, force: true })
}
console.log(JSON.stringify({ observations: rows.length, exactResourceResponses: rows.filter(row => row.exactBytes).length, note: 'Process exit only reports probe completion; individual resource outcomes are recorded above.' }))
