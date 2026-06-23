import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { explorePathsSync } from '@techor/glob'
import {
    collectStandaloneCSSDirectiveExtractionPolicy,
    createCSSDirectiveExtractionPolicy,
    findStandaloneCSSDirectiveStatements,
    mergeCSSDirectiveExtractionPolicy,
    removeStandaloneCSSDirectives,
    type StandaloneCSSDirectiveStatement
} from '@master/css-compiler'
import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives'

export type StylesheetDirectives = CSSDirectiveExtractionPolicy

export type StylesheetDirectiveStatement = StandaloneCSSDirectiveStatement

export interface StylesheetSourceOptions {
    include?: string[]
    exclude?: string[]
    safelist?: string[]
    blocklist?: (string | RegExp)[]
}

export interface CollectedStylesheetDirectives {
    directives: StylesheetDirectives
    dependencies: string[]
}

export function createStylesheetDirectives(): StylesheetDirectives {
    return createCSSDirectiveExtractionPolicy()
}

export function hasStylesheetDirectives(directives?: StylesheetDirectives) {
    return Boolean(directives && (
        directives.include.length ||
        directives.exclude.length ||
        directives.safelist.length ||
        directives.blocklist.length ||
        directives.preserveNative
    ))
}

export function hasStylesheetSourceDirectives(directives?: StylesheetDirectives) {
    return Boolean(directives && (
        directives.include.length ||
        directives.exclude.length
    ))
}

function normalizePath(source: string) {
    return source.replace(/\\/g, '/')
}

function normalizeSourcePattern(pattern: string, file?: string, cwd = process.cwd()) {
    if (pattern.startsWith('./') || pattern.startsWith('../')) {
        const absolutePattern = resolve(file ? dirname(file) : cwd, pattern)
        return normalizePath(relative(cwd, absolutePattern) || '.')
    }
    if (isAbsolute(pattern)) {
        return normalizePath(relative(cwd, pattern) || '.')
    }
    return normalizePath(pattern)
}

export function mergeStylesheetDirectives(...directives: (Partial<StylesheetDirectives> | undefined)[]) {
    return mergeCSSDirectiveExtractionPolicy(...directives)
}

export function mergeStylesheetSourceOptions<T extends StylesheetSourceOptions>(options: T, directives?: StylesheetDirectives): T {
    if (!directives) return options
    return {
        ...options,
        include: [...new Set([...(options.include || []), ...directives.include])],
        exclude: [...new Set([...(options.exclude || []), ...directives.exclude])],
        safelist: [...new Set([...(options.safelist || []), ...directives.safelist])],
        blocklist: [...(options.blocklist || []), ...directives.blocklist]
    } as T
}

export function findStylesheetDirectiveStatements(source: string): StylesheetDirectiveStatement[] {
    return findStandaloneCSSDirectiveStatements(source)
}

export function removeStylesheetDirectiveStatements(source: string) {
    const code = removeStandaloneCSSDirectives(source)
    return {
        code,
        removed: code !== source
    }
}

export function collectStylesheetDirectives(source: string, file?: string, cwd = process.cwd()): StylesheetDirectives {
    const directives = collectStandaloneCSSDirectiveExtractionPolicy(source)
    directives.include = directives.include.map((arg: string) => normalizeSourcePattern(arg, file, cwd))
    directives.exclude = directives.exclude.map((arg: string) => normalizeSourcePattern(arg, file, cwd))
    return directives
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
    const match = /^\s*@import\s+(?:(["'])(.*?)\1|url\(\s*(?:(["'])(.*?)\3|([^'")\s]+))\s*\))[^;]*;\s*$/s.exec(statement)
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

function collectCSSGraphDirectivesFile(
    file: string,
    source: string,
    cwd: string,
    dependencies: string[],
    dependencySet: Set<string>,
    stack: string[]
): StylesheetDirectives {
    const absoluteFile = resolve(file)
    if (stack.includes(absoluteFile)) {
        throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
    }
    if (!dependencySet.has(absoluteFile)) {
        dependencySet.add(absoluteFile)
        dependencies.push(absoluteFile)
    }

    let directives = collectStylesheetDirectives(source, absoluteFile, cwd)
    for (const importStatement of findImportStatements(source)) {
        const importSource = parseImportSource(importStatement.statement)
        if (!importSource || !isExpandableStyleImportSource(importSource)) continue
        const importedFile = resolve(dirname(absoluteFile), importSource)
        if (!existsSync(importedFile)) {
            throw new Error(`CSS file not found: ${importedFile}`)
        }
        directives = mergeStylesheetDirectives(
            directives,
            collectCSSGraphDirectivesFile(
                importedFile,
                readFileSync(importedFile, 'utf-8'),
                cwd,
                dependencies,
                dependencySet,
                [...stack, absoluteFile]
            )
        )
    }
    return directives
}

export function collectStylesheetDirectivesFromCSSGraph(file: string, source?: string, cwd = process.cwd()): CollectedStylesheetDirectives {
    const dependencies: string[] = []
    const filename = resolve(file)
    return {
        directives: collectCSSGraphDirectivesFile(
            filename,
            source ?? readFileSync(filename, 'utf-8'),
            cwd,
            dependencies,
            new Set(),
            []
        ),
        dependencies
    }
}

export function resolveStylesheetSourcePaths(options: StylesheetSourceOptions, cwd = process.cwd()) {
    const paths = new Set<string>()
    if (options.include?.length) {
        for (const sourcePath of explorePathsSync(options.include, { cwd, ignore: options.exclude })) {
            if (sourcePath) paths.add(sourcePath)
        }
    }
    return [...paths]
}
