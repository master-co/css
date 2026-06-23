import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
    prepareNextStatic,
    resolveStaticOutputPath,
    resolveStaticScanLogPath,
    resolveStaticStatePath
} from '../src/static'
import masterCSSNextStaticCSSLoader from '../src/static-css-loader'
import masterCSSNextStaticLoader from '../src/static-loader'

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
    return new Promise<string>((resolve, reject) => {
        const context: ThisParameterType<typeof masterCSSNextStaticCSSLoader> = {
            resourcePath,
            addDependency: (dependency) => dependencies.push(dependency),
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
    }).then((content) => ({ content, dependencies }))
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

        const css = readFileSync(outputPath, 'utf-8')
        expect(css).toContain('display:block')
        expect(css).toContain('margin:0')
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
        expect(readFileSync(outputPath, 'utf-8')).toContain('.main')
        expect(readFileSync(outputPath, 'utf-8')).toContain('display:block')
        expect(readFileSync(outputPath, 'utf-8')).toContain('color: var(--color-primary)')
        expect(readFileSync(outputPath, 'utf-8')).toContain('--color-primary:red')
    }, 30000)

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

        await prepareNextStatic({ mode: 'static' }, { projectDir: root })
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
        expect(readFileSync(outputPath, 'utf-8')).toContain('display:block')
        expect(readFileSync(outputPath, 'utf-8')).toContain('.main')
        expect(replaced).not.toContain('.unused')
        expect(replaced).toContain('../.master/next.css')
        expect(replaced).not.toContain('@master/css')
        expect(readFileSync(outputPath, 'utf-8')).not.toContain('.unused')
    })

    it('adds output and managed CSS entry files as CSS loader dependencies for dev updates', async () => {
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

        expect(result.dependencies).toContain(outputPath)
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
        expect(readFileSync(outputPath, 'utf-8')).not.toContain('--color-primary')
    })

    it('lets the scanner loader feed an imported module into the scanner incrementally', async () => {
        const root = createFixture()
        const outputPath = resolveStaticOutputPath(root)
        const statePath = resolveStaticStatePath(outputPath)
        const scanLogPath = resolveStaticScanLogPath(outputPath)

        await prepareNextStatic({ mode: 'static' }, { projectDir: root })

        expect(readFileSync(outputPath, 'utf-8')).not.toContain('display:block')

        const modulePath = join(root, 'app/main.ts')
        const source = `
            export const mainClass = 'block m:0'
        `
        await expect(runStaticLoader(statePath, modulePath, source)).resolves.toBe(source)

        const css = readFileSync(outputPath, 'utf-8')
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

        const css = readFileSync(outputPath, 'utf-8')
        expect(css).toContain('display:block')
        expect(css).not.toContain('123456px')
    })

    it('updates static CSS when Turbopack reruns the source loader', async () => {
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

        expect(readFileSync(outputPath, 'utf-8')).toContain('display:block')
        expect(readFileSync(outputPath, 'utf-8')).not.toContain('margin:0')

        writeFileSync(pagePath, `
            export default function Page() {
                return <main className="block m:0">Hello</main>
            }
        `)

        await runStaticLoader(statePath, pagePath, readFileSync(pagePath, 'utf-8'))

        expect(readFileSync(outputPath, 'utf-8')).toContain('margin:0')
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

        expect(readFileSync(outputPath, 'utf-8')).toContain('color: red')

        writeFileSync(globalsPath, `
            @import "@master/css";

            .card {
                color: blue;
            }
        `)

        await runStaticCSSLoader(statePath, globalsPath, readFileSync(globalsPath, 'utf-8'))

        const css = readFileSync(outputPath, 'utf-8')
        expect(css).toContain('color: #00f')
        expect(css).not.toContain('color: red')
    })
})
