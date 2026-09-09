import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

assert(process.cwd().includes('master-css-bh-isolated-'))
const root = resolve('.results/bug-hunt-mime')
await mkdir(root, { recursive: true })
const wasm = await readFile('node_modules/@master/css-runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm')
await writeFile(resolve(root, 'engine.wasm'), wasm)
await writeFile(resolve(root, 'index.html'), '<!doctype html><title>MIME control</title>')
for (const suite of ['runtime-mutation-diagnostics', 'runtime-style-invalidation-diagnostics']) {
  const original = await readFile(`shared/${suite}.ts`, 'utf8')
  const copy = resolve(`shared/.bug-hunt-${suite}.ts`)
  // Only a disposable copy gains an export; the actual private server function
  // and all its source/imports remain byte-identical to the measured revision.
  await writeFile(copy, original + '\nexport { startStaticFileServer as bugHuntServer }\n')
  try {
    const { bugHuntServer } = await import(pathToFileURL(copy))
    const server = await bugHuntServer(root)
    try {
      const response = await fetch(new URL('engine.wasm', server.origin))
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('content-type'), 'application/wasm')
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), wasm)
      assert.equal((await fetch(new URL('missing.wasm', server.origin))).status, 404)
      console.log(JSON.stringify({ suite, status: response.status, mime: response.headers.get('content-type'),
        bytes: wasm.length, sourceHash: createHash('sha256').update(original).digest('hex'), pass: true }))
    } finally { await server.close() }
  } finally { await rm(copy) }
}
