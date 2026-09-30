import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const config = fileURLToPath(new URL('../shared/tsdown-package.config.ts', import.meta.url))
const tsdown = path.resolve(path.dirname(require.resolve('tsdown/package.json')), 'dist/run.mjs')

test('package declarations stay in dist when a dependency is outside rootDir', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'master-package-declarations-'))
  const packageRoot = path.join(directory, 'consumer')
  const sourceRoot = path.join(packageRoot, 'src')
  const dependencyRoot = path.join(directory, 'dependency/src')
  try {
    await mkdir(sourceRoot, { recursive: true })
    await mkdir(dependencyRoot, { recursive: true })
    const sources = new Map([
      [path.join(sourceRoot, 'index.ts'), 'export { value } from "../../dependency/src/value"\n'],
      [path.join(sourceRoot, 'ambient.d.ts'), 'declare const fixtureAmbient: string\n'],
      [path.join(dependencyRoot, 'value.ts'), 'export const value = 42\n']
    ])
    for (const [file, text] of sources) await writeFile(file, text)
    await writeFile(path.join(packageRoot, 'package.json'), JSON.stringify({
      name: '@master/eslint-plugin-css', type: 'module', types: './dist/index.d.ts'
    }))
    await writeFile(path.join(packageRoot, 'tsconfig.prod.json'), JSON.stringify({
      compilerOptions: { rootDir: 'src', outDir: 'dist', target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler' },
      include: ['src/**/*']
    }))
    const result = spawnSync(process.execPath, [tsdown, '--config', config], {
      cwd: packageRoot, encoding: 'utf8', timeout: 30000
    })
    assert.ifError(result.error)
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.match(await readFile(path.join(packageRoot, 'dist/index.d.ts'), 'utf8'), /export.*value/)
    assert.deepEqual((await readdir(sourceRoot)).sort(), ['ambient.d.ts', 'index.ts'])
    assert.deepEqual((await readdir(dependencyRoot)).sort(), ['value.ts'])
    for (const [file, text] of sources) assert.equal(await readFile(file, 'utf8'), text)
    assert.doesNotMatch(result.stdout, /entry:.*ambient\.d\.ts/)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
