import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
    prepareNextExtract,
    resolveExtractOutputPath,
    resolveExtractScanLogPath,
    resolveExtractStatePath
} from '../src/extract'
import masterCSSNextExtractCSSLoader from '../src/extract-css-loader'
import masterCSSNextExtractLoader from '../src/extract-loader'

function createFixture() {
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-extract-'))
    mkdirSync(join(root, 'app'), { recursive: true })
    writeFileSync(join(root, 'app/globals.css'), '@import "@master/css";')
    return root
}

function runExtractLoader(statePath: string, resourcePath: string, source: string) {
    return new Promise<string>((resolve, reject) => {
        const context: ThisParameterType<typeof masterCSSNextExtractLoader> = {
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

        masterCSSNextExtractLoader.call(context, source)
    })
}

function runExtractCSSLoader(statePath: string, resourcePath: string, source: string) {
    return runExtractCSSLoaderWithDependencies(statePath, resourcePath, source)
        .then((result) => result.content)
}

function runExtractCSSLoaderWithDependencies(statePath: string, resourcePath: string, source: string) {
    const dependencies: string[] = []
    return new Promise<string>((resolve, reject) => {
        const context: ThisParameterType<typeof masterCSSNextExtractCSSLoader> = {
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

        masterCSSNextExtractCSSLoader.call(context, source)
    }).then((content) => ({ content, dependencies }))
}

describe('Next extract mode', () => {
    beforeEach(() => {
        globalThis.__MASTER_CSS_NEXT_EXTRACT_SESSIONS__ = new Map()
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

        const outputPath = resolveExtractOutputPath(root)

        await prepareNextExtract({ mode: 'extract' }, { projectDir: root })

        const css = readFileSync(outputPath, 'utf-8')
        expect(css).toContain('display:block')
        expect(css).toContain('margin:0')
    })

    it('replaces @master/css imports for dev CSS chunks and preserves ordinary CSS', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'app/globals.css'), `
            @import "@master/css";

            @master {
                --color-primary: #ff0000;
            }
        `)
        writeFileSync(join(root, 'app/page.tsx'), `
            export default function Page() {
                return <main className="main block">Hello</main>
            }
        `)

        const outputPath = resolveExtractOutputPath(root)
        const statePath = resolveExtractStatePath(outputPath)

        await prepareNextExtract({ mode: 'extract' }, { projectDir: root })

        const source = `
            @import "@master/css";

            .main {
                color: var(--color-primary);
            }

            @master {
                --color-primary: #ff0000;
            }
        `
        const replaced = await runExtractCSSLoader(statePath, join(root, 'app/globals.css'), source)
        expect(replaced).toBe('@import "../.master/next.css";')
        expect(replaced).not.toContain('.main')
        expect(readFileSync(outputPath, 'utf-8')).toContain('.main')
        expect(readFileSync(outputPath, 'utf-8')).toContain('display:block')
        expect(readFileSync(outputPath, 'utf-8')).toContain('color: var(--color-primary)')
        expect(readFileSync(outputPath, 'utf-8')).toContain('--color-primary:red')
    })

    it('shakes dev CSS chunks that import @master/css', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'app/page.tsx'), `
            export default function Page() {
                return <main className="main block">Hello</main>
            }
        `)

        const outputPath = resolveExtractOutputPath(root)
        const statePath = resolveExtractStatePath(outputPath)

        await prepareNextExtract({ mode: 'extract' }, { projectDir: root })

        const replaced = await runExtractCSSLoader(statePath, join(root, 'app/globals.css'), `
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
        writeFileSync(join(root, 'theme.css'), '@master { --color-primary: #00f; }')
        writeFileSync(join(root, 'app/globals.css'), `
            @import "@master/css";
            @import "../theme.css";
        `)

        const outputPath = resolveExtractOutputPath(root)
        const statePath = resolveExtractStatePath(outputPath)

        await prepareNextExtract({ mode: 'extract' }, { projectDir: root })

        const result = await runExtractCSSLoaderWithDependencies(
            statePath,
            join(root, 'app/globals.css'),
            '@import "@master/css";'
        )

        expect(result.dependencies).toContain(outputPath)
        expect(result.dependencies).toContain(join(root, 'app/globals.css'))
        expect(result.dependencies).toContain(join(root, 'theme.css'))
    })

    it('ignores app stylesheets with @master when they do not import @master/css', async () => {
        const root = createFixture()
        const outputPath = resolveExtractOutputPath(root)
        const statePath = resolveExtractStatePath(outputPath)

        await prepareNextExtract({ mode: 'extract' }, { projectDir: root })

        const source = `
            @master {
                --color-primary: #00f;
            }
        `
        const replaced = await runExtractCSSLoader(statePath, join(root, 'app/theme.css'), source)

        expect(replaced).toBe(source)
        expect(readFileSync(outputPath, 'utf-8')).not.toContain('--color-primary')
    })

    it('lets the scanner loader feed an imported module into the extractor incrementally', async () => {
        const root = createFixture()
        const outputPath = resolveExtractOutputPath(root)
        const statePath = resolveExtractStatePath(outputPath)
        const scanLogPath = resolveExtractScanLogPath(outputPath)

        await prepareNextExtract({
            mode: 'extract',
            extractorOptions: {
                include: []
            }
        }, { projectDir: root })

        expect(readFileSync(outputPath, 'utf-8')).not.toContain('display:block')

        const modulePath = join(root, 'app/main.ts')
        const source = `
            export const mainClass = 'block m:0'
        `
        await expect(runExtractLoader(statePath, modulePath, source)).resolves.toBe(source)

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

        const outputPath = resolveExtractOutputPath(root)

        await prepareNextExtract({ mode: 'extract' }, { projectDir: root })

        const css = readFileSync(outputPath, 'utf-8')
        expect(css).toContain('display:block')
        expect(css).not.toContain('123456px')
    })
})
