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

function readVirtualManifestSource(projectDir: string) {
  const manifestDir = join(projectDir, 'node_modules/.master-css')
  const filename = readdirSync(manifestDir).find((entry) => entry.endsWith('.manifest.json'))
  if (!filename) {
    throw new Error(`Expected generated CSS manifest asset in ${manifestDir}.`)
  }
  return readFileSync(join(manifestDir, filename), 'utf-8')
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
    expect(dependencies).toEqual([manifestPath])
    expect(readVirtualManifestModule(projectDir)).toContain('new URL("./')
    expect(readVirtualManifestModule(projectDir)).not.toContain('#123')
    expect(readVirtualManifestSource(projectDir)).toContain('"version":1')
    expect(readVirtualManifestSource(projectDir)).toContain('primary')
    expect(readVirtualManifestSource(projectDir)).toContain('#123')
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
    expect(readVirtualManifestModule(projectDir)).not.toContain('#456')
    expect(readVirtualManifestSource(projectDir)).toContain('package')
    expect(readVirtualManifestSource(projectDir)).toContain('#456')
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
})
