import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import addon from '../../src'

const addonRoot = resolve(__dirname, '../..')
const svRoot = resolve(dirname(createRequire(import.meta.url).resolve('sv')), '../..')

function captureDependencies(definition: typeof addon) {
  const dependencies: [string, string][] = []
  const unexpected = () => { throw new Error('Unexpected add-on operation') }
  definition.run({
    cwd: process.cwd(), isKit: true, packageManager: 'npm', options: {},
    sv: {
      dependency: (name, version) => { dependencies.push([name, version]) }, file: () => {},
      devDependency: unexpected, execute: async () => unexpected(), removeFile: unexpected, files: unexpected
    },
    directory: { src: 'src', lib: 'src/lib', kitRoutes: 'src/routes' },
    file: {
      viteConfig: 'vite.config.ts', stylesheet: 'src/routes/layout.css', typeConfig: 'tsconfig.json',
      package: 'package.json', gitignore: '.gitignore', getRelative: () => './layout.css', findUp: name => name
    },
    language: 'ts', dependencyVersion: () => '5.57.2', cancel: reason => { throw new Error(reason) }
  })
  return dependencies
}

test('unversioned source checkout keeps its development channel', () => {
  expect(captureDependencies(addon)).toEqual([['@master/css', 'rc'], ['@master/css-svelte', 'rc']])
})

for (const version of ['2.0.0', '2.0.0-rc.42', '0.0.0']) {
  test(`packed add-on ${version} asks sv for its exact matching cohort`, () => {
    const fixture = mkdtempSync(join(tmpdir(), 'master-css-sv-489-'))
    try {
      const stage = join(fixture, 'source'), archives = join(fixture, 'archives')
      const consumer = join(fixture, 'consumer'), installed = join(consumer, 'node_modules/@master/css-svelte-addon')
      mkdirSync(stage); mkdirSync(archives); mkdirSync(installed, { recursive: true })
      cpSync(join(addonRoot, 'dist'), join(stage, 'dist'), { recursive: true })
      const manifest = JSON.parse(readFileSync(join(addonRoot, 'package.json'), 'utf8'))
      writeFileSync(join(stage, 'package.json'), JSON.stringify({ ...manifest, version }))
      execFileSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', archives], { cwd: stage, stdio: 'pipe' })
      const packed = readdirSync(archives).filter(file => file.endsWith('.tgz'))
      expect(packed).toHaveLength(1)
      // GNU tar treats a Windows drive in the archive name as a remote host.
      execFileSync('tar', ['-xzf', packed[0], '-C', installed, '--strip-components', '1'], { cwd: archives })
      expect(JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).version).toBe(version)
      // sv supplies the one external peer when it loads a community add-on.
      symlinkSync(svRoot, join(consumer, 'node_modules/sv'), process.platform === 'win32' ? 'junction' : 'dir')
      const source = `import addon from ${JSON.stringify(pathToFileURL(join(installed, 'dist/index.js')).href)};
const captureDependencies = ${captureDependencies.toString()};
console.log(JSON.stringify(captureDependencies(addon)))`
      const output = execFileSync(process.execPath, ['--input-type=module', '--eval', source], { cwd: consumer, encoding: 'utf8' })
      expect(JSON.parse(output)).toEqual([['@master/css', version], ['@master/css-svelte', version]])
    } finally { rmSync(fixture, { recursive: true, force: true }) }
  })
}
