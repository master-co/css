import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
    prepareNextExtract,
    replaceExtractedCSSImport,
    resolveExtractOutputPath,
    resolveExtractScanLogPath,
    resolveExtractStatePath
} from '../src/extract'
import masterCSSNextExtractCSSLoader from '../src/extract-css-loader'
import masterCSSNextExtractLoader from '../src/extract-loader'

function createFixture() {
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-extract-'))
    mkdirSync(join(root, 'app'), { recursive: true })
    writeFileSync(join(root, 'master.css'), '@master {}')
    writeFileSync(join(root, 'app/globals.css'), '@import "virtual:master.css";')
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

function runExtractCSSLoader(statePath: string, source: string) {
    return new Promise<string>((resolve, reject) => {
        const context: ThisParameterType<typeof masterCSSNextExtractCSSLoader> = {
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
    })
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

    it('replaces virtual CSS imports in app stylesheets for dev CSS chunks', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'app/page.tsx'), `
            export default function Page() {
                return <main className="block">Hello</main>
            }
        `)

        const outputPath = resolveExtractOutputPath(root)
        const statePath = resolveExtractStatePath(outputPath)

        await prepareNextExtract({ mode: 'extract' }, { projectDir: root })

        const source = '@import "virtual:master.css";\nbody{margin:0}'
        const replaced = await runExtractCSSLoader(statePath, source)
        expect(replaced).toBe(await replaceExtractedCSSImport(statePath, source))
        expect(replaced).toContain('display:block')
        expect(replaced).toContain('body{margin:0}')
        expect(replaced).not.toContain('virtual:master.css')
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
