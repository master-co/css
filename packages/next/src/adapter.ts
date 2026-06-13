import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { render } from '@master/css-server'
import type { NextAdapter } from 'next'
import { getRegisteredOptions, resolveOptions, type Options } from './options'
import { resolveMasterCSSBuildPlan } from './style-plan'

type BuildCompleteContext = Parameters<NonNullable<NextAdapter['onBuildComplete']>>[0]
type BuildOutputs = BuildCompleteContext['outputs']

interface HTMLBuildOutput {
    filePath: string
    pathname: string
    source: 'static' | 'prerender-fallback'
}

export interface RenderedOutput {
    file: string
    pathname: string
    source: HTMLBuildOutput['source']
    classes: string[]
    cssBytes: number
    rendered: boolean
}

export interface RenderManifest {
    version: 1
    nextVersion: string
    buildId: string
    files: RenderedOutput[]
}

function isHTMLFile(filePath: string | undefined): filePath is string {
    if (!filePath) return false
    return ['.html', '.htm'].includes(extname(filePath).toLowerCase())
}

function collectHTMLBuildOutputs(outputs: BuildOutputs): HTMLBuildOutput[] {
    const htmlOutputs: HTMLBuildOutput[] = []
    const seen = new Set<string>()

    function add(output: HTMLBuildOutput) {
        if (seen.has(output.filePath)) return
        seen.add(output.filePath)
        htmlOutputs.push(output)
    }

    for (const output of outputs.staticFiles) {
        if (isHTMLFile(output.filePath)) {
            add({
                filePath: output.filePath,
                pathname: output.pathname,
                source: 'static'
            })
        }
    }

    for (const output of outputs.prerenders) {
        if (isHTMLFile(output.fallback?.filePath)) {
            add({
                filePath: output.fallback.filePath,
                pathname: output.pathname,
                source: 'prerender-fallback'
            })
        }
    }

    return htmlOutputs
}

async function writeManifest(ctx: BuildCompleteContext, files: RenderedOutput[], manifest: boolean | string) {
    if (!manifest) return
    const manifestPath = typeof manifest === 'string'
        ? resolve(ctx.distDir, manifest)
        : join(ctx.distDir, 'master-css-manifest.json')
    const data: RenderManifest = {
        version: 1,
        nextVersion: ctx.nextVersion,
        buildId: ctx.buildId,
        files
    }
    await mkdir(dirname(manifestPath), { recursive: true })
    await writeFile(manifestPath, JSON.stringify(data, null, 2))
}

function createMasterStyleText(cssText: string) {
    return `<style id="master">${cssText}</style>`
}

function upsertMasterStyleText(html: string, cssText: string) {
    const stylePattern = /(<style\b(?=[^>]*\bid=(["'])master\2)[^>]*>)([\s\S]*?)(<\/style>)/
    if (stylePattern.test(html)) {
        return html.replace(
            stylePattern,
            (_match, open: string, _quote: string, _content: string, close: string) => open + cssText + close
        )
    }
    const headCloseIndex = html.search(/<\/head\s*>/i)
    const styleText = createMasterStyleText(cssText)
    return headCloseIndex === -1
        ? styleText + html
        : html.slice(0, headCloseIndex) + styleText + html.slice(headCloseIndex)
}

export async function renderNextBuildOutputs(ctx: BuildCompleteContext, rawOptions: Options = getRegisteredOptions() ?? {}) {
    const options = resolveOptions(rawOptions)
    if (options.mode === null) return []

    const baseBuildPlan = await resolveMasterCSSBuildPlan(ctx.projectDir)
    const htmlOutputs = collectHTMLBuildOutputs(ctx.outputs)
    const renderedOutputs: RenderedOutput[] = []

    for (const output of htmlOutputs) {
        const sourceHTML = await readFile(output.filePath, 'utf-8')
        const rendered = render(sourceHTML, baseBuildPlan.plan, { runtimeManifest: 'inject' })
        const buildPlan = await resolveMasterCSSBuildPlan(ctx.projectDir, rendered.classes)
        const generatedCSS = rendered.css?.classUtilities.size ? rendered.css.text : ''
        const cssText = [
            buildPlan.nativeCSS,
            generatedCSS
        ].filter(Boolean).join('\n\n')
        const renderedHTML = cssText
            ? upsertMasterStyleText(rendered.html, cssText)
            : sourceHTML
        const didRender = renderedHTML !== sourceHTML

        if (didRender) {
            await writeFile(output.filePath, renderedHTML)
        }

        renderedOutputs.push({
            file: output.filePath,
            pathname: output.pathname,
            source: output.source,
            classes: rendered.classes,
            cssBytes: Buffer.byteLength(cssText),
            rendered: didRender
        })
    }

    await writeManifest(ctx, renderedOutputs, options.manifest)

    if (options.debug) {
        const renderedCount = renderedOutputs.filter((output) => output.rendered).length
        console.log(`[@master/css.next] rendered ${renderedCount}/${renderedOutputs.length} HTML output(s)`)
    }

    return renderedOutputs
}

export function createAdapter(options?: Options): NextAdapter {
    return {
        name: '@master/css.next',
        async onBuildComplete(ctx) {
            await renderNextBuildOutputs(ctx, options ?? getRegisteredOptions() ?? {})
        }
    }
}

export default createAdapter()
