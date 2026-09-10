import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import withMasterCSS from '../../../../packages/next/dist/index.js'

const require = createRequire(new URL('../../../../packages/next/package.json', import.meta.url))
const { webpack } = require('next/dist/compiled/webpack/webpack')
const root = mkdtempSync(join(tmpdir(), 'next-virtual-uri-')), cwd = process.cwd(), oldNodeEnv = process.env.NODE_ENV
const ids = ['virtual:master-css-manifest', 'virtual:master-css-emitted-globals', 'virtual:master-utilities.css']
let compiler
try {
  process.chdir(root);process.env.NODE_ENV = 'development'
  writeFileSync(join(root, 'entry.js'), `import manifest from ${JSON.stringify(ids[0])};import globals from ${JSON.stringify(ids[1])};import ${JSON.stringify(ids[2])};export const version = manifest.version;export const emittedGlobals = globals;export async function dynamic(){return (await import(${JSON.stringify(ids[0])})).default.version}`)
  const config = withMasterCSS({}, { mode: 'pre-render' }).webpack({
    mode: 'development', target: 'node', context: root, entry: './entry.js', devtool: false,
    output: { path: join(root, 'dist'), filename: 'bundle.cjs', library: { type: 'commonjs2' } }
  }, { webpack })
  compiler = webpack(config)
  const stats = await new Promise((resolve, reject) => compiler.run((error, value) => error ? reject(error) : resolve(value)))
  const errors = stats.toJson({ all: false, errors: true }).errors?.map(error => ({ moduleName: error.moduleName, message: error.message })) ?? []
  const artifact = fileURLToPath(new URL('../../../../packages/next/dist/index.js', import.meta.url))
  console.log(JSON.stringify({ scope: 'Installed Next Webpack compiler, no CSS imports or native CSS rules, official three virtual IDs plus dynamic manifest import', indexSHA256: createHash('sha256').update(readFileSync(artifact)).digest('hex'), aliases: Object.fromEntries(ids.map(id => [id, config.resolve.alias[id]])), errors }))
  assert.deepEqual(errors, [])
  const exports = require(join(root, 'dist/bundle.cjs'))
  assert.equal(exports.version, 1);assert.equal(await exports.dynamic(), 1)
  assert.deepEqual(exports.emittedGlobals, { variables: {}, animations: {} })
  console.log(JSON.stringify({ pass: true, version: exports.version, emittedGlobals: exports.emittedGlobals, dynamic: 1 }))
} catch (error) {
  console.log(JSON.stringify({ pass: false, error: String(error) }));process.exitCode = 1
} finally {
  if (compiler) await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
  process.chdir(cwd)
  if (oldNodeEnv === undefined) delete process.env.NODE_ENV;else process.env.NODE_ENV = oldNodeEnv
  rmSync(root, { recursive: true, force: true })
}
