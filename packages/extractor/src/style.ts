import { compileCSS, type CompileCSSOptions, type CompileCSSResult } from '@master/css-compiler'
import { AnimationRule, createCSS, extendConfig, VariableRule, type Config } from '@master/css'
import { loadConfig } from '@master/css-explore-config'
import { createRequire } from 'node:module'
import { extname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type CSSExtractor from './core'

export const STYLE_CSS_REQUEST_RE = /\.(css|scss|sass)(?:[?#].*)?$/

const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g
const require = createRequire(import.meta.url)

type StyleCSSModuleIds = string | Iterable<string>
type LoadConfigMode = 'always' | 'css' | false

export interface SassModule {
    compileStringAsync(source: string, options: {
        url: URL
        style: 'expanded'
        syntax: 'scss' | 'indented'
    }): Promise<{ css: string }>
}

export interface CompileStyleCSSOptions extends CompileCSSOptions {
    projectDir?: string
    loadSass?: (projectDir?: string) => SassModule
}

export interface RegisterStyleCSSSourceOptions extends CompileStyleCSSOptions {
    moduleIds?: StyleCSSModuleIds
}

export interface CreateExtractedCSSOptions extends CompileStyleCSSOptions {
    extractor: CSSExtractor
    styleCSSSources?: Map<string, string>
    config?: Config
    configPath?: string
    loadConfigMode?: LoadConfigMode
}

function toModuleIdArray(moduleIds: StyleCSSModuleIds) {
    return typeof moduleIds === 'string' ? [moduleIds] : Array.from(moduleIds)
}

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function defaultLoadSass(projectDir?: string): SassModule {
    if (projectDir) {
        try {
            return createRequire(join(projectDir, 'package.json'))('sass') as SassModule
        } catch {
            // Fall through to this package's dependency graph for tests and linked workspaces.
        }
    }
    return require('sass') as SassModule
}

export function normalizeStyleCSSModuleIds(moduleIds: StyleCSSModuleIds) {
    const ids = new Set<string>()
    for (const id of toModuleIdArray(moduleIds)) {
        if (!id) continue
        ids.add(id)
        if (id.startsWith('virtual:')) {
            ids.add(id.slice('virtual:'.length))
        } else {
            ids.add(`virtual:${id}`)
        }
    }
    return ids
}

export function createStyleCSSImportPattern(moduleIds: StyleCSSModuleIds) {
    const ids = [...normalizeStyleCSSModuleIds(moduleIds)].map(escapeRegExp)
    return new RegExp(String.raw`@import\s+(?:url\(\s*)?(['"])(?:${ids.join('|')})\1\s*\)?[^;]*;`)
}

export function createMasterStyleCSSPattern(moduleIds: StyleCSSModuleIds) {
    return createStyleCSSImportPattern(moduleIds)
}

export function cleanStyleRequest(id: string) {
    return id.replace(/[?#].*$/, '')
}

export function isStyleCSSRequest(id: string) {
    return STYLE_CSS_REQUEST_RE.test(id)
}

export function replaceStyleCSSImports(source: string, moduleIds: StyleCSSModuleIds, replacement: string) {
    let replaced = false
    const ids = normalizeStyleCSSModuleIds(moduleIds)
    const code = source.replace(CSS_IMPORT_RE, (rule, _quote: string, id: string) => {
        if (!ids.has(id)) return rule
        replaced = true
        return replacement
    })
    return { code, replaced }
}

export function removeStyleCSSImports(source: string, moduleIds: StyleCSSModuleIds) {
    return replaceStyleCSSImports(source, moduleIds, '')
}

export function hasStyleCSSImport(source: string, moduleIds: StyleCSSModuleIds) {
    return removeStyleCSSImports(source, moduleIds).replaced
}

export function isMasterStyleSource(source: string, moduleIds: StyleCSSModuleIds) {
    return hasStyleCSSImport(source, moduleIds)
}

export async function preprocessStyleCSS(source: string, id: string, options: CompileStyleCSSOptions = {}) {
    const filename = cleanStyleRequest(id)
    const extension = extname(filename)
    if (extension !== '.scss' && extension !== '.sass') return source

    const sass = (options.loadSass || defaultLoadSass)(options.projectDir)
    const result = await sass.compileStringAsync(source, {
        url: pathToFileURL(filename),
        style: 'expanded',
        syntax: extension === '.sass' ? 'indented' : 'scss'
    })
    return result.css
}

export async function compileStyleCSS(
    id: string,
    source: string,
    options: CompileStyleCSSOptions = {}
): Promise<CompileCSSResult> {
    const { projectDir: _projectDir, loadSass: _loadSass, ...compileOptions } = options
    const css = await preprocessStyleCSS(source, id, options)
    return compileCSS(css, {
        ...compileOptions,
        from: cleanStyleRequest(id)
    })
}

export function getNativeCSS(result: { css?: string, generatedCSS?: string, nativeCSS?: string }) {
    if (result.nativeCSS !== undefined) return result.nativeCSS
    const css = result.css || ''
    const generatedCSS = result.generatedCSS || ''
    if (generatedCSS && css.endsWith(generatedCSS)) {
        return css.slice(0, -generatedCSS.length).trim()
    }
    return css
}

export function getExtractorClasses(extractor: CSSExtractor) {
    return [...new Set([
        ...(extractor.latentClasses || []),
        ...(extractor.validClasses || []),
        ...(extractor.usedNativeClasses || []),
        ...(extractor.options.includeClasses || [])
    ])]
}

export function refreshExtractorNativeClasses(extractor: CSSExtractor, nativeClassNames: string[]) {
    let changed = false
    for (const className of nativeClassNames) {
        if (!extractor.nativeClassNames.has(className)) {
            extractor.nativeClassNames.add(className)
            changed = true
        }
        if (extractor.latentClasses.has(className) && !extractor.usedNativeClasses.has(className)) {
            extractor.usedNativeClasses.add(className)
            changed = true
        }
    }
    if (changed) {
        extractor.emit('change')
    }
}

export async function registerStyleCSSSource(
    extractor: CSSExtractor,
    styleCSSSources: Map<string, string>,
    id: string,
    source: string,
    options: RegisterStyleCSSSourceOptions = {}
) {
    const filename = cleanStyleRequest(id)
    const moduleIds = options.moduleIds ?? extractor.options.module as string
    const cleanSource = removeStyleCSSImports(source, moduleIds).code
    const { moduleIds: _moduleIds, ...compileOptions } = options
    const result = await compileStyleCSS(filename, cleanSource, compileOptions)
    styleCSSSources.set(filename, cleanSource)
    refreshExtractorNativeClasses(extractor, result.nativeClassNames)
    return result
}

export function collectCSSVariableReferences(source: string) {
    const references = new Set<string>()
    for (const match of source.matchAll(/var\(\s*--([_a-zA-Z0-9-]+)/g)) {
        references.add(match[1])
    }
    return references
}

function collectStyleCSSVariableReferences(nativeCSS: string[]) {
    const references = new Set<string>()
    for (const source of nativeCSS) {
        for (const reference of collectCSSVariableReferences(source)) {
            references.add(reference)
        }
    }
    return references
}

function insertVariableReferences(css: ReturnType<typeof createCSS>, references: Set<string>) {
    for (const name of references) {
        const variable = css.variables.get(name)
        if (!variable) continue
        css.themeLayer.insert(new VariableRule(name, variable, css))
    }
}

function collectCSSAnimationReferences(source: string, animationNames: Iterable<string>) {
    const references = new Set<string>()
    const names = Array.from(animationNames)
    if (!names.length) return references
    for (const match of source.matchAll(/\banimation(?:-name)?\s*:\s*([^;{}]+)/g)) {
        const value = match[1]
        for (const name of names) {
            if (new RegExp(String.raw`(^|[\s,])${escapeRegExp(name)}(?=$|[\s,])`).test(value)) {
                references.add(name)
            }
        }
    }
    return references
}

function collectNativeCSSAnimationReferences(nativeCSS: string[], animationNames: Iterable<string>) {
    const references = new Set<string>()
    for (const source of nativeCSS) {
        for (const reference of collectCSSAnimationReferences(source, animationNames)) {
            references.add(reference)
        }
    }
    return references
}

function insertAnimationReferences(css: ReturnType<typeof createCSS>, references: Set<string>) {
    for (const name of references) {
        const keyframes = css.animations.get(name)
        if (!keyframes) continue
        const rule = new AnimationRule(name, keyframes, css)
        css.animationsNonLayer.insert(rule)
        insertVariableReferences(css, rule.variableNames ?? new Set())
    }
}

export async function createExtractedCSS(options: CreateExtractedCSSOptions) {
    const {
        extractor,
        styleCSSSources,
        config: configOption,
        configPath = extractor.resolvedConfigPath,
        loadConfigMode = 'always',
        ...compileOptions
    } = options
    const classes = compileOptions.classes ?? getExtractorClasses(extractor)
    const shouldLoadConfig = Boolean(configPath && (
        loadConfigMode === 'always' ||
        (loadConfigMode === 'css' && extname(configPath) === '.css')
    ))

    if (!shouldLoadConfig && !configOption && !compileOptions.classes && !styleCSSSources?.size) {
        return extractor.css.text
    }

    const styleResults = await Promise.all(
        Array.from(styleCSSSources || [])
            .map(([id, source]) => compileStyleCSS(id, source, {
                ...compileOptions,
                classes
            }))
    )
    const nativeCSS = styleResults.map((result) => result.nativeCSS).filter(Boolean)
    const configResult = shouldLoadConfig && configPath
        ? await loadConfig(configPath, { classes })
        : undefined

    const css = createCSS(extendConfig(configResult?.config ?? configOption ?? extractor.config))
    for (const className of classes) {
        css.add(className)
    }
    insertVariableReferences(css, collectStyleCSSVariableReferences(nativeCSS))
    insertAnimationReferences(css, collectNativeCSSAnimationReferences(nativeCSS, css.animations.keys()))
    return [
        ...nativeCSS,
        css.text
    ].filter(Boolean).join('\n\n')
}
