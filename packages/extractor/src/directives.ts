import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { explorePathsSync } from '@techor/glob'
import type { Options } from './options'

const MASTER_DIRECTIVE_NAMES = new Set(['shake', 'source', 'class'])

export interface ExtractorDirectives {
    include: string[]
    exclude: string[]
    sources: string[]
    includeClasses: string[]
    excludeClasses: (string | RegExp)[]
}

export interface ExtractorDirectiveStatement {
    start: number
    end: number
    name: string
    args: string[]
    modifiers: string[]
}

export interface CollectedExtractorDirectives {
    directives: ExtractorDirectives
    dependencies: string[]
}

export function createExtractorDirectives(): ExtractorDirectives {
    return {
        include: [],
        exclude: [],
        sources: [],
        includeClasses: [],
        excludeClasses: []
    }
}

export function hasExtractorDirectives(directives?: ExtractorDirectives) {
    return Boolean(directives && (
        directives.include.length ||
        directives.exclude.length ||
        directives.sources.length ||
        directives.includeClasses.length ||
        directives.excludeClasses.length
    ))
}

export function hasExtractorSourceDirectives(directives?: ExtractorDirectives) {
    return Boolean(directives && (
        directives.include.length ||
        directives.exclude.length ||
        directives.sources.length
    ))
}

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function wildcardToRegExp(source: string) {
    return new RegExp(`^${source.split(/([*?])/g).map((part) => {
        if (part === '*') return '.*'
        if (part === '?') return '.'
        return escapeRegExp(part)
    }).join('')}$`)
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

function normalizeClassExclude(pattern: string) {
    return /[*?]/.test(pattern) ? wildcardToRegExp(pattern) : pattern
}

function addUnique<T>(target: T[], values: Iterable<T>) {
    for (const value of values) {
        if (!target.includes(value)) {
            target.push(value)
        }
    }
}

export function mergeExtractorDirectives(...directives: (Partial<ExtractorDirectives> | undefined)[]) {
    const merged = createExtractorDirectives()
    for (const directive of directives) {
        if (!directive) continue
        addUnique(merged.include, directive.include || [])
        addUnique(merged.exclude, directive.exclude || [])
        addUnique(merged.sources, directive.sources || [])
        addUnique(merged.includeClasses, directive.includeClasses || [])
        addUnique(merged.excludeClasses, directive.excludeClasses || [])
    }
    return merged
}

export function mergeExtractorOptions(options: Options, directives?: ExtractorDirectives): Options {
    if (!directives) return options
    return {
        ...options,
        include: [...new Set([...(options.include || []), ...directives.include])],
        exclude: [...new Set([...(options.exclude || []), ...directives.exclude])],
        sources: [...new Set([...(options.sources || []), ...directives.sources])],
        includeClasses: [...new Set([...(options.includeClasses || []), ...directives.includeClasses])],
        excludeClasses: [...(options.excludeClasses || []), ...directives.excludeClasses]
    }
}

function isIdentChar(char: string | undefined) {
    return Boolean(char && /[-_a-zA-Z0-9]/.test(char))
}

function findStatementEnd(source: string, start: number) {
    let quote = ''
    let comment = false
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
        if (char === ';') return index + 1
        if (char === '{') return -1
    }
    return -1
}

function parseQuotedStrings(source: string) {
    const values: string[] = []
    let quote = ''
    let value = ''
    for (let index = 0; index < source.length; index++) {
        const char = source[index]
        if (!quote) {
            if (char === '"' || char === '\'') {
                quote = char
                value = ''
            }
            continue
        }
        if (char === '\\') {
            value += source[index + 1] || ''
            index++
            continue
        }
        if (char === quote) {
            values.push(value)
            quote = ''
            continue
        }
        value += char
    }
    return values
}

function parseUnquotedWords(source: string) {
    const words: string[] = []
    let quote = ''
    let comment = false
    let word = ''
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
            if (char === '\\') index++
            else if (char === quote) quote = ''
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            if (word) {
                words.push(word)
                word = ''
            }
            continue
        }
        if (isIdentChar(char)) {
            word += char
            continue
        }
        if (word) {
            words.push(word)
            word = ''
        }
    }
    if (word) words.push(word)
    return words
}

export function findExtractorDirectiveStatements(source: string): ExtractorDirectiveStatement[] {
    const statements: ExtractorDirectiveStatement[] = []
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
        if (depth !== 0 || !source.startsWith('@master', index)) continue

        let cursor = index + '@master'.length
        if (isIdentChar(source[cursor]) || !/\s/.test(source[cursor] || '')) continue
        while (/\s/.test(source[cursor] || '')) cursor++
        const nameStart = cursor
        while (isIdentChar(source[cursor])) cursor++
        const name = source.slice(nameStart, cursor)
        if (!MASTER_DIRECTIVE_NAMES.has(name)) continue
        const end = findStatementEnd(source, cursor)
        if (end === -1) continue
        const prelude = source.slice(cursor, end - 1)
        const args = parseQuotedStrings(prelude)
        statements.push({
            start: index,
            end,
            name,
            args,
            modifiers: parseUnquotedWords(prelude)
        })
        index = end - 1
    }
    return statements
}

export function removeExtractorDirectiveStatements(source: string) {
    const statements = findExtractorDirectiveStatements(source)
    if (!statements.length) return { code: source, removed: false }
    let code = ''
    let index = 0
    for (const statement of statements) {
        code += source.slice(index, statement.start)
        index = statement.end
    }
    return {
        code: code + source.slice(index),
        removed: true
    }
}

export function collectExtractorDirectives(source: string, file?: string, cwd = process.cwd()) {
    const directives = createExtractorDirectives()
    for (const statement of findExtractorDirectiveStatements(source)) {
        if (statement.name === 'source') {
            if (statement.modifiers.includes('exclude')) {
                directives.exclude.push(...statement.args.map((arg) => normalizeSourcePattern(arg, file, cwd)))
            } else if (statement.modifiers.includes('force')) {
                directives.sources.push(...statement.args.map((arg) => normalizeSourcePattern(arg, file, cwd)))
            } else {
                directives.include.push(...statement.args.map((arg) => normalizeSourcePattern(arg, file, cwd)))
            }
        } else if (statement.name === 'class') {
            const classes = statement.args.flatMap((arg) => arg.split(/\s+/).filter(Boolean))
            if (statement.modifiers.includes('exclude')) {
                directives.excludeClasses.push(...classes.map(normalizeClassExclude))
            } else {
                directives.includeClasses.push(...classes)
            }
        }
    }
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
): ExtractorDirectives {
    const absoluteFile = resolve(file)
    if (stack.includes(absoluteFile)) {
        throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
    }
    if (!dependencySet.has(absoluteFile)) {
        dependencySet.add(absoluteFile)
        dependencies.push(absoluteFile)
    }

    let directives = collectExtractorDirectives(source, absoluteFile, cwd)
    for (const importStatement of findImportStatements(source)) {
        const importSource = parseImportSource(importStatement.statement)
        if (!importSource || !isExpandableStyleImportSource(importSource)) continue
        const importedFile = resolve(dirname(absoluteFile), importSource)
        if (!existsSync(importedFile)) {
            throw new Error(`CSS file not found: ${importedFile}`)
        }
        directives = mergeExtractorDirectives(
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

export function collectExtractorDirectivesFromCSSGraph(file: string, source?: string, cwd = process.cwd()): CollectedExtractorDirectives {
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

export function resolveExtractorSourcePaths(options: Options, cwd = process.cwd()) {
    const paths = new Set<string>()
    if (options.include?.length) {
        for (const sourcePath of explorePathsSync(options.include, { cwd, ignore: options.exclude })) {
            if (sourcePath) paths.add(sourcePath)
        }
    }
    if (options.sources?.length) {
        for (const sourcePath of explorePathsSync(options.sources, { cwd })) {
            if (sourcePath) paths.add(sourcePath)
        }
    }
    return [...paths]
}
