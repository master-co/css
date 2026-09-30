import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import {
  compileCSS,
  compileProjectManifest,
  inspectCSS,
  resolveMasterCSSPackageEntryFile
} from '../src/node-compiler'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')

test.concurrent('recognizes only the preset import as a project entry', () => {
  for (const source of ['@master entry;', '@master;', '@master global;']) {
    expect(inspectCSS(source).hasMasterEntry).toBe(false)
    expect(() => compileCSS(source)).toThrow()
  }
  expect(inspectCSS('@import "@master/css";')).toMatchObject({ hasMasterCSSImport: true, hasMasterEntry: true })
})

test('resolves CSS-only preset package root to stylesheet entry', () => {
  const presetPackageJSONFile = resolve(repoRoot, 'packages/preset/package.json')
  const presetPackageJSON = JSON.parse(readFileSync(presetPackageJSONFile, 'utf8')) as {
    exports?: Record<string, unknown>
  }

  expect(presetPackageJSON.exports?.['.']).toEqual({
    style: './src/index.css',
    default: './src/index.css'
  })

  const entry = resolveMasterCSSPackageEntryFile(
    '@master/css-preset',
    fileURLToPath(import.meta.url),
    repoRoot
  )
  const expectedEntry = resolve(repoRoot, 'packages/preset/src/index.css')

  expect(entry).toBe(expectedEntry)
  expect(entry ? existsSync(entry) : false).toBe(true)
})

test('resolves package stylesheet entry before requiring the package JavaScript entry', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-package-entry-'))
  try {
    const packageRoot = join(root, 'node_modules/@master/css')
    const entryFile = join(root, 'src/app.css')
    mkdirSync(join(packageRoot, 'src'), { recursive: true })
    mkdirSync(dirname(entryFile), { recursive: true })
    writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({
      name: '@master/css',
      style: './src/index.css',
      exports: {
        '.': {
          style: './src/index.css',
          import: './dist/index.js',
          default: './dist/index.js'
        }
      }
    }))
    writeFileSync(join(packageRoot, 'src/index.css'), `@theme { --color-primary: #123456; }

`)
    writeFileSync(entryFile, '@import "@master/css";')

    const packageStyleEntry = join(realpathSync(packageRoot), 'src/index.css')
    const entry = resolveMasterCSSPackageEntryFile('@master/css', entryFile, root)
    const result = compileProjectManifest([entryFile], { root })

    expect(entry).toBe(packageStyleEntry)
    expect(result.dependencies).toContain(packageStyleEntry)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
