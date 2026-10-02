import { mkdirSync, mkdtempSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import masterCSSManifestLoader from '../src/css-manifest-loader'

let fixtureDir: string | undefined

function createFixtureDir() {
  fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-'))
  return fixtureDir
}

function runManifestLoader(context: {
  resourcePath: string
  rootContext?: string
  getOptions?: () => any
  addDependency?: (dependency: string) => void
}) {
  return new Promise<string>((resolve, reject) => {
    masterCSSManifestLoader.call({
      ...context,
      async: () => (error: Error | null, result?: string) => {
        if (error) {
          reject(error)
          return
        }
        resolve(result || '')
      }
    })
  })
}

afterEach(() => {
  if (fixtureDir) {
    rmSync(fixtureDir, { recursive: true, force: true })
    fixtureDir = undefined
  }
})

describe('css manifest loader', () => {
  it('turns a CSS entry resource into an importable manifest JSON asset', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    const dependencies: string[] = []
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(manifestPath, `@theme { --color-primary: #123; }
`)

    const source = await runManifestLoader({
      resourcePath: manifestPath,
      addDependency: (dependency: string) => dependencies.push(dependency)
    })

    expect(dependencies).toEqual([manifestPath])
    expect(source).toContain('"version":6')
    expect(JSON.parse(source).version).toBe(6)
    expect(source).toContain('primary')
    expect(source).toContain('#123')
  })

  it('wraps the manifest JSON as an ECMAScript module when requested', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(manifestPath, `@theme { --color-primary: #123; }
`)

    const source = await runManifestLoader({
      resourcePath: manifestPath,
      getOptions: () => ({ module: true })
    })

    expect(source).toMatch(/^export default \{"version":6/)
    expect(source).toContain('primary')
    expect(source).toContain('#123')
  })

  it('exports standard ESM data without writing bundler output assets', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    writeFileSync(manifestPath, `@theme { --color-primary: #123; }
`)
    const source = await runManifestLoader({
      resourcePath: manifestPath,
      rootContext: projectDir,
      getOptions: () => ({ module: true })
    })
    const { default: manifest } = await import(`data:text/javascript,${encodeURIComponent(source)}`)
    expect(manifest.languageVersion).toBe(15)
    expect(JSON.stringify(manifest)).toContain('#123')
    expect(source).not.toContain('fetch(')
    expect(source).not.toContain('/_next/')
    expect(existsSync(join(projectDir, '.next'))).toBe(false)
  })

  it('inlines manifest modules in development for HMR', async () => {
    const originalNodeEnv = process.env.NODE_ENV
    const env = process.env as Record<string, string | undefined>
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(manifestPath, `@theme { --color-primary: #123; }
`)

    try {
      env.NODE_ENV = 'development'
      const source = await runManifestLoader({
        resourcePath: manifestPath,
        rootContext: projectDir,
        getOptions: () => ({ module: true })
      })

      expect(source).toMatch(/^export default \{"version":6/)
      expect(source).toContain('#123')
      expect(source).not.toContain('loadMasterCSSManifestFromImport')
    } finally {
      if (originalNodeEnv === undefined) {
        delete env.NODE_ENV
      } else {
        env.NODE_ENV = originalNodeEnv
      }
    }
  })

  it('loads CSS when the loader resource includes ?master-css-manifest', async () => {
    const projectDir = createFixtureDir()
    const manifestPath = join(projectDir, 'index.css')
    const dependencies: string[] = []
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(manifestPath, `@theme {
    --color-primary: #123;
 }

@mixin --btn {
        color: var(--color-primary);
    } @utility btn {
        color: var(--color-primary);
    }`)

    const source = await runManifestLoader({
      resourcePath: `${manifestPath}?master-css-manifest`,
      addDependency: (dependency: string) => dependencies.push(dependency)
    })

    expect(dependencies).toEqual([manifestPath])
    expect(source).toContain('"version":6')
    expect(source).toContain('primary')
    expect(source).toContain('#123')
    expect(source).toContain('"--btn"')
    expect(JSON.parse(source).mixins.find((mixin: { name: string }) => mixin.name === '--btn').body).toContainEqual(expect.objectContaining({ property: 'color', value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: '--color-primary' }] }] }))
  })

  it('loads the default virtual manifest from CSS entry files only', async () => {
    const projectDir = createFixtureDir()
    mkdirSync(join(projectDir, 'app'), { recursive: true })
    const entryPath = join(projectDir, 'app/globals.css')
    const preserveOnlyPath = join(projectDir, 'app/preserve.css')
    const dependencies: string[] = []
    writeFileSync(entryPath, `@import url("@master/css");
@theme {
    --color-primary: #123;
 }

@mixin --btn { color: var(--color-primary); } @utility btn { color: var(--color-primary); }`)
    writeFileSync(preserveOnlyPath, `@preserve native;
@theme {
    --color-ignored: #456;
 }
`)

    const source = await runManifestLoader({
      resourcePath: join(projectDir, 'node_modules/.master-css/master-css-manifest.js'),
      rootContext: projectDir,
      getOptions: () => ({ virtual: true }),
      addDependency: (dependency: string) => dependencies.push(dependency)
    })

    expect(source).toContain('"version":6')
    expect(source).toContain('primary')
    expect(source).toContain('#123')
    expect(source).toContain('"--btn"')
    expect(source).not.toContain('ignored')
    expect(dependencies).toContain(entryPath)
    expect(dependencies).not.toContain(preserveOnlyPath)
  })

  it('loads emitted globals from project CSS entry files', async () => {
    const projectDir = createFixtureDir()
    const entryPath = join(projectDir, 'app/globals.css')
    const dependencies: string[] = []
    mkdirSync(join(projectDir, 'app'), { recursive: true })
    writeFileSync(entryPath, `@import url("@master/css");
@theme { --color-primary: #123; }

@prune native;@theme {  }@keyframes fade { to { opacity: 0; } }
.host { color: var(--color-primary); animation: fade 1s; }`)

    const source = await runManifestLoader({
      resourcePath: join(projectDir, 'node_modules/.master-css/master-css-emitted-globals.js'),
      rootContext: projectDir,
      getOptions: () => ({ emittedGlobals: true }),
      addDependency: (dependency: string) => dependencies.push(dependency)
    })
    const emittedGlobals = JSON.parse(source.replace(/^export default /, '').replace(/;$/, ''))

    expect(emittedGlobals.variables['color-primary']).toBe(1)
    expect(emittedGlobals).not.toHaveProperty('animations')
    expect(Object.values(emittedGlobals.keyframes)).toEqual([1, 1])
    expect(Object.keys(emittedGlobals.keyframes)).toEqual(expect.arrayContaining([expect.stringMatching(/^k.*-o\d+$/)]))
    expect(emittedGlobals.keyframeSlots).toEqual(expect.arrayContaining(Object.keys(emittedGlobals.keyframes)))
    expect(dependencies).toContain(entryPath)
  })

  it('keeps virtual manifest dependencies registered after invalid CSS and recovers on the next run', async () => {
    const projectDir = createFixtureDir()
    const entryPath = join(projectDir, 'app/globals.css')
    const virtualManifestPath = join(projectDir, 'node_modules/.master-css/master-css-manifest.js')
    const dependencies: string[] = []
    mkdirSync(join(projectDir, 'app'), { recursive: true })
    writeFileSync(entryPath, "@import url(\"@master/css\");\n@mixin --card {\n        @compose bg-missing-token;\n    } @utility card {\n        @compose bg-missing-token;\n    }")

    await expect(runManifestLoader({
      resourcePath: virtualManifestPath,
      rootContext: projectDir,
      getOptions: () => ({ virtual: true, module: true }),
      addDependency: (dependency: string) => dependencies.push(dependency)
    })).rejects.toThrow('@compose has been removed')
    expect(dependencies).toContain(entryPath)

    writeFileSync(entryPath, "@import url(\"@master/css\");\n@mixin --card {\n        @media all{display:block;}\n    } @utility card {\n        @media all{display:block;}\n    }")

    const source = await runManifestLoader({
      resourcePath: virtualManifestPath,
      rootContext: projectDir,
      getOptions: () => ({ virtual: true, module: true })
    })

    expect(source).toContain('"version":6')
    expect(source).toContain('"--card"')
    expect(source).toContain('display')
  })
})
