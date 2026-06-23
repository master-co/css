import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
    closeNextStaticSessions,
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

async function waitForFileMatch(filepath: string, predicate: (content: string) => boolean) {
    const deadline = Date.now() + 5000
    let lastContent = ''
    while (Date.now() < deadline) {
        try {
            lastContent = readFileSync(filepath, 'utf-8')
            if (predicate(lastContent)) return lastContent
        } catch {
            // File is not ready yet.
        }
        await new Promise((resolve) => setTimeout(resolve, 25))
    }
    throw new Error(`Timed out waiting for ${filepath} to match. Last content: ${lastContent}`)
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

    afterEach(async () => {
        await closeNextStaticSessions()
    })

    it('writes extracted CSS from source files including imported modules', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'app/page.tsx'), `
            import { mainClass } from './main'

            export default function Page() {
                return <main className={mainClass}>Hello</main>
            }
        `)
        writeFileSync(join(root, 'app/main.ts'), `
            export const mainClass = 'block m:0'
        `)

        const outputPath = resolveStaticOutputPath(root)

        await prepareNextStatic({ mode: 'static' }, { projectDir: root })

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
        writeFileSync(join(root, 'app/page.tsx'), `
            export default function Page() {
                return <main className="main block">Hello</main>
            }
        `)

        const outputPath = resolveStaticOutputPath(root)
        const statePath = resolveStaticStatePath(outputPath)

        await prepareNextStatic({ mode: 'static' }, { projectDir: root })

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
        writeFileSync(join(root, 'app/page.tsx'), `
            export default function Page() {
                return <main className="main block">Hello</main>
            }
        `)

        const outputPath = resolveStaticOutputPath(root)
        const statePath = resolveStaticStatePath(outputPath)

        await prepareNextStatic({ mode: 'static' }, { projectDir: root })

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

        await prepareNextStatic({
            mode: 'static',
            scannerOptions: {
                include: []
            }
        }, { projectDir: root })

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

    it('does not scan node_modules during the baseline source pass', async () => {
        const root = createFixture()
        mkdirSync(join(root, 'node_modules/pkg'), { recursive: true })
        writeFileSync(join(root, 'node_modules/pkg/index.ts'), `
            export const leaked = 'width:123456px'
        `)
        writeFileSync(join(root, 'app/page.tsx'), `
            export default function Page() {
                return <main className="block">Hello</main>
            }
        `)

        const outputPath = resolveStaticOutputPath(root)

        await prepareNextStatic({ mode: 'static' }, { projectDir: root })

        const css = readFileSync(outputPath, 'utf-8')
        expect(css).toContain('display:block')
        expect(css).not.toContain('123456px')
    })

    it('watches static source changes in development mode', async () => {
        const root = createFixture()
        const pagePath = join(root, 'app/page.tsx')
        writeFileSync(pagePath, `
            export default function Page() {
                return <main className="block">Hello</main>
            }
        `)

        const outputPath = resolveStaticOutputPath(root)

        await prepareNextStatic({ mode: 'static' }, { projectDir: root, watch: true })

        expect(readFileSync(outputPath, 'utf-8')).toContain('display:block')
        expect(readFileSync(outputPath, 'utf-8')).not.toContain('margin:0')

        writeFileSync(pagePath, `
            export default function Page() {
                return <main className="block m:0">Hello</main>
            }
        `)

        await waitForFileMatch(outputPath, (css) => css.includes('margin:0'))
    }, 10000)

    it('watches static CSS dependency changes in development mode', async () => {
        const root = createFixture()
        const globalsPath = join(root, 'app/globals.css')
        writeFileSync(globalsPath, `
            @import "@master/css";

            .card {
                color: red;
            }
        `)
        writeFileSync(join(root, 'app/page.tsx'), `
            export default function Page() {
                return <main className="card">Hello</main>
            }
        `)

        const outputPath = resolveStaticOutputPath(root)

        await prepareNextStatic({ mode: 'static' }, { projectDir: root, watch: true })

        expect(readFileSync(outputPath, 'utf-8')).toContain('color: red')

        writeFileSync(globalsPath, `
            @import "@master/css";

            .card {
                color: blue;
            }
        `)

        const css = await waitForFileMatch(outputPath, (content) => content.includes('color: #00f'))
        expect(css).not.toContain('color: red')
    }, 10000)
})
