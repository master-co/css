import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  prepareNextStatic,
  resolveStaticOutputPath,
  resolveStaticScanLogPath,
  resolveStaticStatePath
} from '../src/static'
import masterCSSNextStaticCSSLoader from '../src/static-css-loader'
import masterCSSNextStaticLoader from '../src/static-loader'

// Native CSS may live in immutable child stylesheets; inspect only the current graph.
function readStaticCSS(file: string, seen = new Set<string>()): string {
  if (seen.has(file)) return ''
  seen.add(file)
  const css = readFileSync(file, 'utf-8')
  const imports = [...css.matchAll(/@import\s+["']([^"']+)["']/g)].filter(([, href]) => href.startsWith('.'))
  return css + imports.map(([, href]) => readStaticCSS(fileURLToPath(new URL(href, pathToFileURL(file))), seen)).join('\n')
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-next-static-'))
  mkdirSync(join(root, 'app'), { recursive: true })
  writeFileSync(join(root, 'app/globals.css'), '@import "@master/css";')
  return root
}

function runStaticLoader(statePath: string, resourcePath: string, source: string) {
  return new Promise<string>((resolve, reject) => {
    const context: ThisParameterType<typeof masterCSSNextStaticLoader> = {
      resourcePath,
      cacheable: () => undefined,
      getOptions: () => ({ statePath }),
      async: () => (error, content) => {
        if (error) {
          reject(error)
        } else {
          resolve(content || '')
        }
      }
    }

    masterCSSNextStaticLoader.call(context, source)
  })
}

function scanStaticFixtureModule(statePath: string, resourcePath: string) {
  return runStaticLoader(statePath, resourcePath, readFileSync(resourcePath, 'utf-8'))
}

function runStaticCSSLoader(statePath: string, resourcePath: string, source: string) {
  return runStaticCSSLoaderWithDependencies(statePath, resourcePath, source)
    .then((result) => result.content)
}

function runStaticCSSLoaderWithDependencies(statePath: string, resourcePath: string, source: string) {
  const dependencies: string[] = []
  const contexts: string[] = []
  const missing: string[] = []
  return new Promise<string>((resolve, reject) => {
    const context: ThisParameterType<typeof masterCSSNextStaticCSSLoader> = {
      resourcePath,
      addDependency: (dependency) => dependencies.push(dependency),
      addContextDependency: (directory) => contexts.push(directory),
      addMissingDependency: (file) => missing.push(file),
      cacheable: () => undefined,
      getOptions: () => ({ statePath }),
      async: () => (error, content) => {
        if (error) {
          reject(error)
        } else {
          resolve(content || '')
        }
      }
    }

    masterCSSNextStaticCSSLoader.call(context, source)
  }).then((content) => ({ content, dependencies, contexts, missing }))
}

describe('Next static mode', () => {
  beforeEach(() => {
    globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ = new Map()
  })

  it('writes extracted CSS from source files including imported modules', async () => {
    const root = createFixture()
    const pagePath = join(root, 'app/page.tsx')
    const modulePath = join(root, 'app/main.ts')
    writeFileSync(pagePath, `
      import { mainClass } from './main'

      export default function Page() {
        return <main className={mainClass}>Hello</main>
      }
    `)
    writeFileSync(modulePath, `
      export const mainClass = 'block m:0'
    `)

    const outputPath = resolveStaticOutputPath(root)
    const statePath = resolveStaticStatePath(outputPath)

    await prepareNextStatic({ mode: 'static' }, { projectDir: root })
    await scanStaticFixtureModule(statePath, pagePath)
    await scanStaticFixtureModule(statePath, modulePath)

    const css = readStaticCSS(outputPath)
    expect(css).toContain('@layer base')
    expect(css).toContain('text-rendering: geometricprecision')
    expect(css).toContain('display:block')
    expect(css).toContain('margin:0')
  })

  it('keeps Webpack module watches and lets generated CSS discover new sources', async () => {
    const root = createFixture()
    const first = join(root, 'app/page.tsx'), second = join(root, 'app/other.tsx')
    writeFileSync(first, '<div className="p:11px"/>')
    writeFileSync(second, '<div className="m:22px"/>')
    const state = (await prepareNextStatic({}, { projectDir: root }))!
    const dependencies: string[] = [], contexts: string[] = [], missing: string[] = []
    await new Promise<void>((resolve, reject) => {
      const jsContext = {
        resourcePath: first,
        getOptions: () => ({ statePath: state.statePath }),
        addDependency: file => dependencies.push(file),
        addContextDependency: directory => contexts.push(directory),
        addMissingDependency: file => missing.push(file),
        async: () => error => error ? reject(error) : resolve()
      } satisfies ThisParameterType<typeof masterCSSNextStaticLoader> & {
        addContextDependency: (directory: string) => void
        addMissingDependency: (file: string) => void
      }
      masterCSSNextStaticLoader.call(jsContext, readFileSync(first, 'utf8'))
    })
    expect(dependencies).toEqual(expect.arrayContaining([state.statePath, first, second]))
    expect(contexts).toContain(root)
    expect(missing).toEqual(expect.arrayContaining([join(root, '.gitignore'), join(root, 'app/.gitignore')]))

    const stylesheet = join(root, 'app/globals.css')
    const entry = await runStaticCSSLoaderWithDependencies(state.statePath, stylesheet, readFileSync(stylesheet, 'utf8'))
    expect(entry.dependencies).toEqual(expect.arrayContaining([state.statePath, first, second]))
    expect(entry.contexts).toContain(root)
    expect(entry.missing).toEqual(expect.arrayContaining([join(root, '.gitignore'), join(root, 'app/.gitignore')]))

    writeFileSync(first, '<div className="p:44px"/>')
    await runStaticLoader(state.statePath, first, readFileSync(first, 'utf8'))
    expect(readStaticCSS(state.outputPath)).toContain('padding:44px')
    const refreshed = await runStaticCSSLoaderWithDependencies(state.statePath, stylesheet, readFileSync(stylesheet, 'utf8'))
    expect(refreshed.dependencies).toContain(first)
    expect(readStaticCSS(state.outputPath)).toContain('padding:44px')

    const added = join(root, 'app/added.tsx')
    writeFileSync(added, '<div className="gap:33px"/>')
    const generated = await runStaticCSSLoaderWithDependencies(state.statePath, state.outputPath, readFileSync(state.outputPath, 'utf8'))
    expect(generated.content).toContain('gap:33px')
    expect(generated.dependencies).toContain(added)
    expect(generated.contexts).toContain(root)

    const renamed = join(root, 'app/renamed.tsx')
    renameSync(added, renamed)
    const afterRename = await runStaticCSSLoaderWithDependencies(state.statePath, state.outputPath, generated.content)
    expect(afterRename.content).toContain('gap:33px')
    expect(afterRename.dependencies).toContain(renamed)
    expect(afterRename.dependencies).not.toContain(added)

    rmSync(renamed)
    writeFileSync(join(root, '.gitignore'), 'ignored.tsx\n')
    writeFileSync(join(root, 'ignored.tsx'), '<div className="m:55px"/>')
    const afterRemoval = await runStaticCSSLoaderWithDependencies(state.statePath, state.outputPath, afterRename.content)
    expect(afterRemoval.content).not.toContain('gap:33px')
    expect(afterRemoval.content).not.toContain('margin:55px')
    expect(afterRemoval.dependencies).toContain(join(root, '.gitignore'))

    const foreign = await runStaticCSSLoaderWithDependencies(state.statePath, join(root, 'other/.master/next.css'), '.foreign{}')
    expect(foreign.content).toBe('.foreign{}')
    expect(foreign.dependencies).toEqual([])
    expect(foreign.contexts).toEqual([])
  })

  it('publishes complete CSS in independent workers before source loaders run, including MDX', async () => {
    const root = createFixture()
    const page = join(root, 'app/page.tsx')
    const document = join(root, 'app/content.mdx')
    writeFileSync(page, '<main className="p:17px" />')
    writeFileSync(document, '<section className="grid-cols:3">Documentation</section>')
    const state = (await prepareNextStatic({}, { projectDir: root }))!
    const initial = readStaticCSS(state.outputPath)
    expect(initial).toContain('padding:17px')
    expect(initial).toContain('repeat(3, minmax(0, 1fr))')
    const firstWorker = globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__
    globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ = new Map()
    try {
      await prepareNextStatic({}, { projectDir: root })
      expect(readStaticCSS(state.outputPath)).toBe(initial)
      writeFileSync(document, '<section className="grid-cols:4">Documentation</section>')
      const result = await runStaticCSSLoaderWithDependencies(state.statePath,
        join(root, 'app/globals.css'), '@import "@master/css";')
      expect(result.dependencies).toContain(document)
      expect(result.dependencies).toContain(page)
      expect(readStaticCSS(state.outputPath)).toContain('repeat(4, minmax(0, 1fr))')
    } finally {
      for (const session of firstWorker?.values() || []) {
        await session.scanner.dispose()
        session.stylesheets.dispose()
      }
    }
  })

  it('replaces @master/css imports for dev CSS chunks and preserves ordinary CSS', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'app/globals.css'), `
      @import "@master/css";

      @theme {
        --color-primary: #ff0000;
      }
    `)
    const pagePath = join(root, 'app/page.tsx')
    writeFileSync(pagePath, `
      export default function Page() {
        return <main className="main block">Hello</main>
      }
    `)

    const outputPath = resolveStaticOutputPath(root)
    const statePath = resolveStaticStatePath(outputPath)

    await prepareNextStatic({ mode: 'static' }, { projectDir: root })
    await scanStaticFixtureModule(statePath, pagePath)

    const source = `
      @import "@master/css";

      .main {
        color: var(--color-primary);
      }

      @theme {
        --color-primary: #ff0000;
      }
    `
    const replaced = await runStaticCSSLoader(statePath, join(root, 'app/globals.css'), source)
    expect(replaced).toBe('@import "../.master/next.css";')
    expect(replaced).not.toContain('.main')
    expect(readStaticCSS(outputPath)).toContain('.main')
    expect(readStaticCSS(outputPath)).toContain('display:block')
    expect(readStaticCSS(outputPath)).toContain('color: var(--color-primary)')
    expect(readStaticCSS(outputPath)).toContain('--color-primary:red')
  })

  it('prunes dev CSS chunks that import @master/css', async () => {
    const root = createFixture()
    const pagePath = join(root, 'app/page.tsx')
    writeFileSync(pagePath, `
      export default function Page() {
        return <main className="main block">Hello</main>
      }
    `)

    const outputPath = resolveStaticOutputPath(root)
    const statePath = resolveStaticStatePath(outputPath)

    await prepareNextStatic({ mode: 'static', pruneNativeCSS: true }, { projectDir: root })
    await scanStaticFixtureModule(statePath, pagePath)

    const replaced = await runStaticCSSLoader(statePath, join(root, 'app/globals.css'), `
      @import "@master/css";

      .main {
        color: red;
      }

      .unused {
        color: blue;
      }
    `)

    expect(replaced).toBe('@import "../.master/next.css";')
    expect(readStaticCSS(outputPath)).toContain('display:block')
    expect(readStaticCSS(outputPath)).toContain('.main')
    expect(replaced).not.toContain('.unused')
    expect(replaced).toContain('../.master/next.css')
    expect(replaced).not.toContain('@master/css')
    expect(readStaticCSS(outputPath)).not.toContain('.unused')
  })

  it('tracks original inputs without adding generated outputs as watcher dependencies', async () => {
    const root = createFixture()
    writeFileSync(join(root, 'theme.css'), '@theme { --color-primary: #00f; }')
    writeFileSync(join(root, 'app/globals.css'), `
      @import "@master/css";
      @import "../theme.css";
    `)

    const outputPath = resolveStaticOutputPath(root)
    const statePath = resolveStaticStatePath(outputPath)

    await prepareNextStatic({ mode: 'static' }, { projectDir: root })

    const result = await runStaticCSSLoaderWithDependencies(
      statePath,
      join(root, 'app/globals.css'),
      '@import "@master/css";'
    )

    expect(result.dependencies).not.toContain(outputPath)
    expect(result.dependencies).toContain(join(root, 'app/globals.css'))
    expect(result.dependencies).toContain(join(root, 'theme.css'))
  })

  it('ignores app stylesheets with @theme when they do not import @master/css', async () => {
    const root = createFixture()
    const outputPath = resolveStaticOutputPath(root)
    const statePath = resolveStaticStatePath(outputPath)

    await prepareNextStatic({ mode: 'static' }, { projectDir: root })

    const source = `
      @theme {
        --color-primary: #00f;
      }
    `
    const replaced = await runStaticCSSLoader(statePath, join(root, 'app/theme.css'), source)

    expect(replaced).toBe(source)
    expect(readStaticCSS(outputPath)).not.toContain('--color-primary')
  })

  it('lets the source loader publish an imported module while the CSS loader owns complete watches', async () => {
    const root = createFixture()
    const outputPath = resolveStaticOutputPath(root)
    const statePath = resolveStaticStatePath(outputPath)
    const scanLogPath = resolveStaticScanLogPath(outputPath)

    await prepareNextStatic({ mode: 'static' }, { projectDir: root })

    expect(readStaticCSS(outputPath)).not.toContain('display:block')

    const modulePath = join(root, 'app/main.ts')
    const source = `
      export const mainClass = 'block m:0'
    `
    writeFileSync(modulePath, source)
    await expect(runStaticLoader(statePath, modulePath, source)).resolves.toBe(source)
    await runStaticCSSLoader(statePath, join(root, 'app/globals.css'), readFileSync(join(root, 'app/globals.css'), 'utf8'))

    const css = readStaticCSS(outputPath)
    expect(css).toContain('display:block')
    expect(css).toContain('margin:0')
    expect(readFileSync(scanLogPath, 'utf-8')).toContain(modulePath)
  })

  it('does not scan excluded node_modules modules from the static loader', async () => {
    const root = createFixture()
    const dependencyPath = join(root, 'node_modules/pkg/index.ts')
    const pagePath = join(root, 'app/page.tsx')
    mkdirSync(join(root, 'node_modules/pkg'), { recursive: true })
    writeFileSync(dependencyPath, `
      export const leaked = 'width:123456px'
    `)
    writeFileSync(pagePath, `
      export default function Page() {
        return <main className="block">Hello</main>
      }
    `)

    const outputPath = resolveStaticOutputPath(root)
    const statePath = resolveStaticStatePath(outputPath)

    await prepareNextStatic({ mode: 'static' }, { projectDir: root })
    await scanStaticFixtureModule(statePath, dependencyPath)
    await scanStaticFixtureModule(statePath, pagePath)

    const css = readStaticCSS(outputPath)
    expect(css).toContain('display:block')
    expect(css).not.toContain('123456px')
  })

  it('updates static CSS when Webpack reruns the source loader', async () => {
    const root = createFixture()
    const pagePath = join(root, 'app/page.tsx')
    writeFileSync(pagePath, `
      export default function Page() {
        return <main className="block">Hello</main>
      }
    `)

    const outputPath = resolveStaticOutputPath(root)
    const statePath = resolveStaticStatePath(outputPath)

    await prepareNextStatic({ mode: 'static' }, { projectDir: root, watch: true })
    await scanStaticFixtureModule(statePath, pagePath)

    expect(readStaticCSS(outputPath)).toContain('display:block')
    expect(readStaticCSS(outputPath)).not.toContain('margin:0')

    writeFileSync(pagePath, `
      export default function Page() {
        return <main className="block m:0">Hello</main>
      }
    `)

    await runStaticLoader(statePath, pagePath, readFileSync(pagePath, 'utf-8'))
    await runStaticCSSLoader(statePath, join(root, 'app/globals.css'), readFileSync(join(root, 'app/globals.css'), 'utf8'))
    expect(readStaticCSS(outputPath)).toContain('margin:0')
  })

  it('updates static CSS when Turbopack reruns the CSS loader', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const pagePath = join(root, 'app/page.tsx')
    writeFileSync(globalsPath, `
      @import "@master/css";

      .card {
        color: red;
      }
    `)
    writeFileSync(pagePath, `
      export default function Page() {
        return <main className="card">Hello</main>
      }
    `)

    const outputPath = resolveStaticOutputPath(root)
    const statePath = resolveStaticStatePath(outputPath)

    await prepareNextStatic({ mode: 'static' }, { projectDir: root, watch: true })
    await scanStaticFixtureModule(statePath, pagePath)

    expect(readStaticCSS(outputPath)).toContain('color: red')

    writeFileSync(globalsPath, `
      @import "@master/css";

      .card {
        color: blue;
      }
    `)

    await runStaticCSSLoader(statePath, globalsPath, readFileSync(globalsPath, 'utf-8'))

    const css = readStaticCSS(outputPath)
    expect(css).toContain('color: #00f')
    expect(css).not.toContain('color: red')
  })
})
