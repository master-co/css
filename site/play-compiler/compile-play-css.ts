import { AnimationRule, MasterCSS, VariableRule, type MasterCSSManifest } from '@master/css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
    compileCSSManifest,
    initCSSCompiler,
    type CompileCSSManifestResult
} from '@master/css-compiler/browser'
import { collectAnimationNamesFromDeclaration } from '@master/css-engine'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const lightningCSSWasmURL = 'https://cdn.jsdelivr.net/npm/lightningcss-wasm@1.32.0/lightningcss_node.wasm'

export interface CompilePlayCSSResult {
    css: string
    manifest: MasterCSSManifest
    warnings: string[]
    result: CompileCSSManifestResult
}

async function initPlayCompiler() {
    if (typeof window === 'undefined') return

    const wasmResponse = fetch(lightningCSSWasmURL)
    await initCSSCompiler(wasmResponse as unknown as Parameters<typeof initCSSCompiler>[0])
}

function collectCSSVariableReferences(source: string) {
    const references = new Set<string>()
    for (const match of source.matchAll(/var\(\s*--([_a-zA-Z0-9-]+)/g)) {
        references.add(match[1])
    }
    return references
}

function collectCSSKeyframeNames(source: string) {
    const names = new Set<string>()
    for (const match of source.matchAll(/@keyframes\s+(-?[_a-zA-Z][-_a-zA-Z0-9]*)/g)) {
        names.add(match[1])
    }
    return names
}

function insertVariableReferences(css: ReturnType<typeof MasterCSS.create>, references: Set<string>) {
    const insert = (name: string, visited = new Set<string>()) => {
        if (visited.has(name)) return
        visited.add(name)
        const variable = css.variables.get(name)
        if (!variable || variable.inline) return
        css.themeLayer.insert(new VariableRule(name, variable, css))
        variable.dependencies?.forEach((dependency) => insert(dependency, visited))
    }
    const visited = new Set<string>()
    for (const name of references) {
        insert(name, visited)
    }
}

function collectCSSAnimationReferences(source: string, css: ReturnType<typeof MasterCSS.create>, ignoredAnimationNames = new Set<string>()) {
    const references = new Set<string>()
    const animationNames = Array.from(css.animations.keys())
    if (!animationNames.length) return references
    for (const match of source.matchAll(/\b(animation(?:-name)?)\s*:\s*([^;{}]+)/g)) {
        for (const name of collectAnimationNamesFromDeclaration(match[1], match[2], {
            animationNames,
            variables: css.variables,
            variableNames: collectCSSVariableReferences(match[2])
        })) {
            if (ignoredAnimationNames.has(name)) continue
            references.add(name)
        }
    }
    return references
}

function insertAnimationReferences(css: ReturnType<typeof MasterCSS.create>, references: Set<string>) {
    for (const name of references) {
        const keyframes = css.animations.get(name)
        if (!keyframes) continue
        const rule = new AnimationRule(name, keyframes, css)
        css.animationsNonLayer.insert(rule)
        insertVariableReferences(css, rule.variableNames ?? new Set())
    }
}

function renderClassCSS(manifest: MasterCSSManifest, classes: string[], nativeCSS: string) {
    const css = MasterCSS.create({ manifest })
    const nativeAnimationNames = collectCSSKeyframeNames(nativeCSS)
    if (nativeAnimationNames.size) {
        css.registerEmittedGlobals({
            animations: Object.fromEntries([...nativeAnimationNames].map((name) => [name, 1]))
        })
    }
    for (const className of classes) {
        css.add(className)
    }
    insertVariableReferences(css, collectCSSVariableReferences(nativeCSS))
    insertAnimationReferences(css, collectCSSAnimationReferences(nativeCSS, css, nativeAnimationNames))
    return css.text
}

export async function compilePlayCSS(sourceCSS: string, classes: string[]): Promise<CompilePlayCSSResult> {
    await initPlayCompiler()

    const result = await compileCSSManifest(sourceCSS, {
        baseManifest: defaultManifest,
        from: 'playground.css'
    })
    const nativeCSS = result.css || ''
    const generatedCSS = renderClassCSS(result.manifest, classes, nativeCSS)
    const css = [
        nativeCSS,
        generatedCSS
    ].filter(Boolean).join('\n\n')
    return {
        css,
        manifest: result.manifest,
        warnings: result.warnings,
        result
    }
}

const playCompilerModule = { compilePlayCSS }
const globalPlayCompiler = globalThis as typeof globalThis & {
    __masterCSSPlayCompiler?: typeof playCompilerModule
    __masterCSSPlayCompilerResolve?: (module: typeof playCompilerModule) => void
}

globalPlayCompiler.__masterCSSPlayCompiler = playCompilerModule
globalPlayCompiler.__masterCSSPlayCompilerResolve?.(playCompilerModule)
