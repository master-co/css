import { compileCSS, type CompileCSSOptions, type CompileCSSResult } from '@master/css-compiler'
import { AnimationRule, createCSS, extendConfig, VariableRule, type Config } from '@master/css'
import { loadConfig } from '@master/css-explore-config'
import { createRequire } from 'node:module'
import { dirname, extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
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
    includeGeneratedCSS?: boolean
}

export interface ResolvedStyleCSSSource {
    source: string
    dependencies: string[]
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

function findImportEnd(source: string, start: number) {
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = start; index < source.length; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(') {
            depth++
            continue
        }
        if (char === ')') {
            depth--
            continue
        }
        if (char === ';' && depth === 0) return index + 1
    }
    return -1
}

function parseImportSource(statement: string) {
    const match = /^\s*@import\s+(?:(["'])(.*?)\1|url\(\s*(?:(["'])(.*?)\3|([^'")\s]+))\s*\))\s*;\s*$/s.exec(statement)
    return match?.[2] || match?.[4] || match?.[5]
}

function isExpandableStyleImportSource(source: string) {
    return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
}

function findImportStatements(source: string) {
    const imports: { start: number, end: number, statement: string }[] = []
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = 0; index < source.length; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '{') {
            depth++
            continue
        }
        if (char === '}') {
            depth--
            continue
        }
        if (depth === 0 && source.startsWith('@import', index) && /\s/.test(source[index + '@import'.length] || '')) {
            const end = findImportEnd(source, index)
            if (end === -1) continue
            imports.push({
                start: index,
                end,
                statement: source.slice(index, end)
            })
            index = end - 1
        }
    }
    return imports
}

function resolveStyleCSSImportGraphFile(
    file: string,
    source: string,
    dependencies: string[],
    dependencySet: Set<string>,
    stack: string[]
): string {
    const absoluteFile = resolve(file)
    if (stack.includes(absoluteFile)) {
        throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
    }
    if (!dependencySet.has(absoluteFile)) {
        dependencySet.add(absoluteFile)
        dependencies.push(absoluteFile)
    }

    const imports = findImportStatements(source)
    if (!imports.length) return source

    let output = ''
    let index = 0
    for (const importStatement of imports) {
        output += source.slice(index, importStatement.start)
        const importSource = parseImportSource(importStatement.statement)
        if (importSource && isExpandableStyleImportSource(importSource)) {
            const importedFile = resolve(dirname(absoluteFile), importSource)
            if (!existsSync(importedFile)) {
                throw new Error(`CSS file not found: ${importedFile}`)
            }
            output += resolveStyleCSSImportGraphFile(
                importedFile,
                readFileSync(importedFile, 'utf-8'),
                dependencies,
                dependencySet,
                [...stack, absoluteFile]
            )
        } else {
            output += importStatement.statement
        }
        index = importStatement.end
    }
    return output + source.slice(index)
}

export function resolveStyleCSSImportGraph(file: string, source: string): ResolvedStyleCSSSource {
    const dependencies: string[] = []
    if (extname(cleanStyleRequest(file)) !== '.css') {
        return {
            source,
            dependencies: [cleanStyleRequest(file)]
        }
    }
    return {
        source: resolveStyleCSSImportGraphFile(cleanStyleRequest(file), source, dependencies, new Set(), []),
        dependencies
    }
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
    const resolvedSource = resolveStyleCSSImportGraph(filename, source)
    const cleanSource = removeStyleCSSImports(resolvedSource.source, moduleIds).code
    const { moduleIds: _moduleIds, ...compileOptions } = options
    const result = await compileStyleCSS(filename, cleanSource, compileOptions)
    result.dependencies = resolvedSource.dependencies
    styleCSSSources.set(filename, cleanSource)
    if (extractor.options.shakeNative !== false) {
        refreshExtractorNativeClasses(extractor, result.nativeClassNames)
    }
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
        includeGeneratedCSS = true,
        ...compileOptions
    } = options
    const classes = compileOptions.classes ?? getExtractorClasses(extractor)
    const shakeNative = extractor.options.shakeNative !== false
    const shouldLoadConfig = Boolean(configPath && (
        loadConfigMode === 'always' ||
        (loadConfigMode === 'css' && extname(configPath) === '.css')
    ))

    if (!shouldLoadConfig && !configOption && !compileOptions.classes && !styleCSSSources?.size) {
        return includeGeneratedCSS ? extractor.css.text : ''
    }

    const styleResults = await Promise.all(
        Array.from(styleCSSSources || [])
            .map(([id, source]) => compileStyleCSS(id, source, {
                ...compileOptions,
                classes: shakeNative ? classes : undefined
            }))
    )
    const nativeCSS = styleResults.map((result) => result.nativeCSS).filter(Boolean)
    const configResult = shouldLoadConfig && configPath
        ? await loadConfig(configPath, { classes })
        : undefined

    const css = createCSS(extendConfig(configResult?.config ?? configOption ?? extractor.config))
    if (includeGeneratedCSS) {
        for (const className of classes) {
            css.add(className)
        }
    }
    const variableReferences = collectStyleCSSVariableReferences(nativeCSS)
    const animationReferences = collectNativeCSSAnimationReferences(nativeCSS, css.animations.keys())
    insertVariableReferences(css, variableReferences)
    insertAnimationReferences(css, animationReferences)
    const shouldIncludeMasterCSS = includeGeneratedCSS || variableReferences.size || animationReferences.size
    return [
        ...nativeCSS,
        shouldIncludeMasterCSS ? css.text : ''
    ].filter(Boolean).join('\n\n')
}
