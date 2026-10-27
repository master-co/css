import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createEngineSync } from '@master/css/node'
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

async function importProgramModule(file: string) {
  const source = readFileSync(file, 'utf-8')
  const { default: program } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`) as { default: unknown }
  expect(program).toBeInstanceOf(Uint8Array)
  return program as Uint8Array
}

function runManifestImportLoader(context: {
  source: string
  resourcePath: string
  projectDir: string
  mode?: string
  addDependency?: (dependency: string) => void
}) {
  return new Promise<string>((resolve, reject) => {
    masterCSSManifestImportLoader.call({
      resourcePath: context.resourcePath,
      mode: context.mode,
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
    writeFileSync(manifestPath, `@theme { --color-primary: #123; }
`)
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
    expect(readVirtualManifestModule(projectDir)).toContain('"version":6')
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
    writeFileSync(join(packageDir, 'theme.css'), `@theme { --color-package: #456; }
`)

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

  it('writes production manifest modules without source provenance beside development ones', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'theme.css')
    const resourcePath = join(projectDir, 'entry.ts')
    writeFileSync(manifestPath, '@utility card { display: block; }\n@keyframes fade { to { opacity: 0; } }')
    const load = (mode: string) => runManifestImportLoader({
      projectDir, resourcePath, mode,
      source: 'export { default } from "./theme.css?master-css-manifest"'
    })
    const readModule = (source: string) => readFileSync(join(projectDir, source.match(/"\.\/([^"]+)"/)![1]), 'utf-8')

    const development = await load('development')
    const production = await load('production')

    expect(production).toContain('.production.manifest.js"')
    expect(development).not.toBe(production)
    expect(readModule(development)).toMatch(/"source":\{"file":"[^"]*theme\.css"/)
    expect(readModule(production)).toContain('"name":"card"')
    expect(readModule(production)).not.toContain('"source"')
  })

  it('leaves non-import strings and unrelated imports unchanged', async () => {
    const projectDir = createFixtureDir()
    const resourcePath = join(projectDir, 'manifest.js')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(resourcePath, '')

    const source = [
      'import manifest from "virtual:master-css-manifest"',
      'import program from "virtual:master-css-program"',
      'const request = "./theme.css?master-css-manifest"',
      'const programRequest = "./theme.css?master-css-program"',
      'export default [manifest, program]'
    ].join('\n')
    await expect(runManifestImportLoader({
      source,
      resourcePath,
      projectDir
    })).resolves.toBe(source)
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
    writeFileSync(manifestPath, `@theme { --color-brand: #123; }
`)
    const first = await runManifestImportLoader(input)
    expect(readVirtualManifestModule(projectDir)).toContain('#123')
    writeFileSync(manifestPath, `@theme { --color-brand: #456; }
`)
    expect(await runManifestImportLoader(input)).toBe(first)
    expect(readVirtualManifestModule(projectDir)).toContain('#456')
    expect(readVirtualManifestModule(projectDir)).not.toContain('#123')
    rmSync(join(projectDir, 'node_modules/.master-css'), { recursive: true })
    expect(await runManifestImportLoader(input)).toBe(first)
    expect(readVirtualManifestModule(projectDir)).toContain('#456')
    expect(dependencies).toContain(manifestPath)
    expect(dependencies.filter(file => file.endsWith('.manifest.js'))).toHaveLength(3)
  })

  it('rewrites CSS program query imports to generated runtime program modules', async () => {
    const projectDir = createFixtureDir()
    const appDir = join(projectDir, 'app')
    const manifestPath = join(appDir, 'theme.css')
    const resourcePath = join(appDir, 'program.ts')
    const dependencies: string[] = []
    mkdirSync(appDir, { recursive: true })
    writeFileSync(manifestPath, '@theme { --color-primary: #123; }\n@utility badge { color: var(--color-primary); }')
    writeFileSync(resourcePath, '')

    const source = await runManifestImportLoader({
      source: [
        'import manifest from "./theme.css?master-css-manifest"',
        'import program from "./theme.css?master-css-program"',
        'export default [manifest, program]'
      ].join('\n'),
      resourcePath,
      projectDir,
      addDependency: (dependency) => dependencies.push(dependency)
    })
    const [, manifestSpecifier, programSpecifier] = source.match(/from "([^"]+)"\nimport program from "([^"]+)"/)!

    expect(manifestSpecifier).toMatch(/^\.\.\/node_modules\/\.master-css\/[^/]+\.manifest\.js$/)
    expect(programSpecifier).toBe(manifestSpecifier.replace(/\.manifest\.js$/, '.program.js'))
    expect(dependencies).toContain(manifestPath)
    expect(dependencies).toContain(join(appDir, programSpecifier))
    using engine = createEngineSync({ program: await importProgramModule(join(appDir, programSpecifier)) })
    expect(engine.ensureClassRules(['badge']).mutations.length).toBeGreaterThan(0)
  })

  it('writes production program modules without source provenance beside development ones', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'theme.css')
    const resourcePath = join(projectDir, 'entry.ts')
    writeFileSync(manifestPath, '@utility card { display: block; }\n@keyframes fade { to { opacity: 0; } }')
    const load = (mode: string) => runManifestImportLoader({
      projectDir, resourcePath, mode,
      source: 'export { default } from "./theme.css?master-css-program"'
    })
    const readProgram = async (source: string) => Buffer.from(await importProgramModule(join(projectDir, source.match(/"\.\/([^"]+)"/)![1])))

    const development = await load('development')
    const production = await load('production')

    expect(development).toContain('.program.js"')
    expect(production).toContain('.production.program.js"')
    expect((await readProgram(development)).includes(manifestPath)).toBe(true)
    const program = await readProgram(production)
    expect(program.includes(projectDir)).toBe(false)
    using engine = createEngineSync({ program })
    expect(engine.ensureClassRules(['card']).mutations.length).toBeGreaterThan(0)
  })

  it('rejects program queries on files other than CSS entries', async () => {
    const projectDir = createFixtureDir()
    const resourcePath = join(projectDir, 'entry.ts')
    writeFileSync(join(projectDir, 'theme.js'), 'export default {}')

    await expect(runManifestImportLoader({
      projectDir, resourcePath,
      source: 'import program from "./theme.js?master-css-program"'
    })).rejects.toThrow('Master CSS program queries only support CSS entry files.')
  })
})
