import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(resolve(repo, 'packages/tooling/package.json'))
const angularRequire = createRequire(resolve('package.json'))
const buildRequire = createRequire(angularRequire.resolve('@angular-devkit/build-angular/package.json'))
const { build } = buildRequire('esbuild')
const cssTreePackage = require.resolve('css-tree/package.json')
const entry = resolve(dirname(cssTreePackage), 'lib/index.js')
const patch = resolve(dirname(cssTreePackage), 'data/patch.json')
assert(Object.keys(JSON.parse(readFileSync(patch, 'utf8'))).length > 0)
const scratch = resolve('audit-controls')
mkdirSync(scratch)
const source = `import {lexer} from ${JSON.stringify(pathToFileURL(entry).href)}; console.log(JSON.stringify({error:lexer.matchProperty('display','block').error}));`
const direct = resolve(scratch, 'direct.mjs')
writeFileSync(direct, source)
const env = { ...process.env }
delete env.NODE_OPTIONS
function run(label, file) {
    const result = spawnSync(process.execPath, [file], { encoding: 'utf8', env, timeout: 30000 })
    console.log(JSON.stringify({ label, status: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message }))
    return result
}
assert.equal(run('direct-installed-css-tree', direct).status, 0)
const bundled = resolve(scratch, 'bundled.mjs')
await build({ stdin: { contents: source.replace(pathToFileURL(entry).href, entry), resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', outfile: bundled })
const bundleText = readFileSync(bundled, 'utf8')
console.log(JSON.stringify({ label: 'bundled-relocation', package: cssTreePackage, patchExists: true, relocatedCode: bundleText.split('\n').filter(line => line.includes('../data/patch.json') || line.includes('createRequire(import.meta.url)')) }))
const broken = run('minimal-bundled-css-tree', bundled)
assert.notEqual(broken.status, 0)
assert(broken.stderr.includes('../data/patch.json'))
const external = resolve(scratch, 'external.mjs')
await build({ stdin: { contents: source.replace(pathToFileURL(entry).href, entry), resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', external: [entry], outfile: external })
assert.equal(run('same-bundler-external-css-tree', external).status, 0)
const built = spawnSync('pnpm', ['run', 'build'], { stdio: 'inherit', timeout: 180000 })
assert.equal(built.status, 0, 'actual Angular build succeeds')
const server = run('actual-Angular-SSR-start', resolve('dist/angular-with-progressive-rendering/server/server.mjs'))
assert(server.stderr.includes('../data/patch.json'), 'same missing patch error reproduced in actual output')
assert.equal(server.status, 0, 'BH-0025: built Angular SSR server must start')
