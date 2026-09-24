import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import masterCSSManifestImportLoader from '../src/css-manifest-import-loader'

let fixtureDir: string | undefined

function createFixtureDir() {
  fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-import-'))
  return fixtureDir
}

function readVirtualManifestModule(projectDir: string) {
  const manifestDir = join(projectDir, 'node_modules/.master-css')
  const [filename] = readdirSync(manifestDir).filter((entry) => entry.endsWith('.manifest.js'))
  return readFileSync(join(manifestDir, filename), 'utf-8')
}

function runManifestImportLoader(context: {
  source: string
  resourcePath: string
  projectDir: string
  addDependency?: (dependency: string) => void
}) {
  return new Promise<string>((resolve, reject) => {
    masterCSSManifestImportLoader.call({
      resourcePath: context.resourcePath,
      getOptions: () => ({
        projectDir: context.projectDir
      }),
      addDependency: context.addDependency,
      async: () => (error: Error | null, result?: string) => {
        if (error) {
          reject(error)
          return
        }
        resolve(result || '')
      }
    }, context.source)
  })
}

afterEach(() => {
  if (fixtureDir) {
    rmSync(fixtureDir, { recursive: true, force: true })
    fixtureDir = undefined
  }
})

describe('css manifest import loader', () => {
  it('rewrites relative CSS manifest query imports from TypeScript modules to generated JS manifest modules', async () => {
    const projectDir = createFixtureDir()
    const appDir = join(projectDir, 'app')
    const manifestPath = join(appDir, 'theme.css')
    const resourcePath = join(appDir, 'manifest.ts')
    const dependencies: string[] = []
    mkdirSync(appDir, { recursive: true })
    writeFileSync(manifestPath, '@theme { --color-primary: #123; }')
    writeFileSync(resourcePath, '')

    const source = await runManifestImportLoader({
      source: 'import presetManifest from "./theme.css?master-css-manifest"\nexport default presetManifest',
      resourcePath,
      projectDir,
      addDependency: (dependency) => dependencies.push(dependency)
    })

    expect(source).toContain('import presetManifest from "../node_modules/.master-css/')
    expect(source).toContain('.manifest.js"')
    expect(dependencies).toContain(manifestPath)
    expect(dependencies.some(path => path.endsWith('.manifest.js'))).toBe(true)
    expect(readVirtualManifestModule(projectDir)).toContain('export default')
    expect(readVirtualManifestModule(projectDir)).toContain('#123')
    expect(readVirtualManifestModule(projectDir)).toContain('"version":1')
    expect(readVirtualManifestModule(projectDir)).toContain('primary')
    expect(readVirtualManifestModule(projectDir)).toContain('#123')
  })

  it('resolves package CSS manifest query imports without package-specific rules', async () => {
    const projectDir = createFixtureDir()
    const appDir = join(projectDir, 'app')
    const packageDir = join(projectDir, 'node_modules/@fixture/tokens')
    const resourcePath = join(appDir, 'manifest.js')
    mkdirSync(appDir, { recursive: true })
    mkdirSync(packageDir, { recursive: true })
    writeFileSync(resourcePath, '')
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({
      name: '@fixture/tokens',
      type: 'module',
      exports: {
        './theme.css': './theme.css'
      }
    }))
    writeFileSync(join(packageDir, 'theme.css'), '@theme { --color-package: #456; }')

    const source = await runManifestImportLoader({
      source: 'import presetManifest from "@fixture/tokens/theme.css?master-css-manifest"\nexport default presetManifest',
      resourcePath,
      projectDir
    })

    expect(source).toContain('import presetManifest from "../node_modules/.master-css/')
    expect(source).toContain('.manifest.js"')
    expect(readVirtualManifestModule(projectDir)).toContain('#456')
    expect(readVirtualManifestModule(projectDir)).toContain('package')
    expect(readVirtualManifestModule(projectDir)).toContain('#456')
  })

  it('leaves non-import strings and unrelated imports unchanged', async () => {
    const projectDir = createFixtureDir()
    const resourcePath = join(projectDir, 'manifest.js')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(resourcePath, '')

    await expect(runManifestImportLoader({
      source: [
        'import manifest from "virtual:master-css-manifest"',
        'const request = "./theme.css?master-css-manifest"',
        'export default manifest'
      ].join('\n'),
      resourcePath,
      projectDir
    })).resolves.toBe([
      'import manifest from "virtual:master-css-manifest"',
      'const request = "./theme.css?master-css-manifest"',
      'export default manifest'
    ].join('\n'))
  })

  it('rebuilds tracked ESM inputs after source changes and output cleanup', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'theme.css')
    const resourcePath = join(projectDir, 'entry.ts')
    const dependencies: string[] = []
    const input = {
      projectDir, resourcePath,
      source: 'export { default } from "./theme.css?master-css-manifest"',
      addDependency: (file: string) => dependencies.push(file)
    }
    writeFileSync(manifestPath, '@theme { --color-brand: #123; }')
    const first = await runManifestImportLoader(input)
    expect(readVirtualManifestModule(projectDir)).toContain('#123')
    writeFileSync(manifestPath, '@theme { --color-brand: #456; }')
    expect(await runManifestImportLoader(input)).toBe(first)
    expect(readVirtualManifestModule(projectDir)).toContain('#456')
    expect(readVirtualManifestModule(projectDir)).not.toContain('#123')
    rmSync(join(projectDir, 'node_modules/.master-css'), { recursive: true })
    expect(await runManifestImportLoader(input)).toBe(first)
    expect(readVirtualManifestModule(projectDir)).toContain('#456')
    expect(dependencies).toContain(manifestPath)
    expect(dependencies.filter(file => file.endsWith('.manifest.js'))).toHaveLength(3)
  })
})
