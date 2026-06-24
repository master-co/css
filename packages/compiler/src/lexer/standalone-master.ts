import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives'
import { escapeRegExp, MASTER_CSS_ENTRY_DIRECTIVE_NAME } from '@master/css-lexer'
import { findAtRuleStatementEnd, removeSourceRanges } from './source'

export type StandaloneCSSDirectiveName = 'master' | 'source' | 'safelist' | 'blocklist' | 'preserve'

export interface StandaloneCSSDirectiveStatement {
    start: number
    end: number
    atRuleName: StandaloneCSSDirectiveName
    name: string
    statement: string
    args: string[]
    modifiers: string[]
}

export type StandaloneMasterDirectiveStatement = StandaloneCSSDirectiveStatement & {
    atRuleName: 'master'
}

const STANDALONE_CSS_DIRECTIVE_NAMES = new Set<StandaloneCSSDirectiveName>([
    'master',
    'source',
    'safelist',
    'blocklist',
    'preserve'
])

function isIdentChar(char: string | undefined) {
    return Boolean(char && /[-_a-zA-Z0-9]/.test(char))
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

function wildcardToRegExp(source: string) {
    return new RegExp(`^${source.split(/([*?])/g).map((part) => {
        if (part === '*') return '.*'
        if (part === '?') return '.'
        return escapeRegExp(part)
    }).join('')}$`)
}

function normalizeBlocklistPattern(pattern: string) {
    return /[*?]/.test(pattern) ? wildcardToRegExp(pattern) : pattern
}

function addUnique<T>(target: T[], values: Iterable<T>) {
    for (const value of values) {
        if (!target.includes(value)) {
            target.push(value)
        }
    }
}

export function createCSSDirectiveExtractionPolicy(): CSSDirectiveExtractionPolicy {
    return {
        include: [],
        exclude: [],
        safelist: [],
        blocklist: [],
        preserveNative: false
    }
}

export function mergeCSSDirectiveExtractionPolicy(...policies: (Partial<CSSDirectiveExtractionPolicy> | undefined)[]) {
    const merged = createCSSDirectiveExtractionPolicy()
    for (const policy of policies) {
        if (!policy) continue
        addUnique(merged.include, policy.include || [])
        addUnique(merged.exclude, policy.exclude || [])
        addUnique(merged.safelist, policy.safelist || [])
        addUnique(merged.blocklist, policy.blocklist || [])
        merged.preserveNative ||= Boolean(policy.preserveNative)
    }
    return merged
}

function parseAtRuleName(source: string, start: number) {
    let cursor = start + 1
    while (isIdentChar(source[cursor])) cursor++
    return source.slice(start + 1, cursor)
}

function parseStandaloneCSSDirectiveStatement(
    source: string,
    start: number,
    atRuleName: StandaloneCSSDirectiveName
) {
    const end = findAtRuleStatementEnd(source, start)
    if (end === -1) return
    const statement = source.slice(start, end)
    const prelude = statement
        .replace(new RegExp(`^@${atRuleName}\\b`), '')
        .replace(/;$/, '')
    const name = atRuleName === 'master' ? MASTER_CSS_ENTRY_DIRECTIVE_NAME : atRuleName
    if (atRuleName === 'master' && prelude.trim() !== MASTER_CSS_ENTRY_DIRECTIVE_NAME) return
    return {
        start,
        end,
        atRuleName,
        name,
        statement,
        args: parseQuotedStrings(prelude),
        modifiers: parseUnquotedWords(prelude)
    } satisfies StandaloneCSSDirectiveStatement
}

export function findStandaloneCSSDirectiveStatements(source: string, filename = 'master.css') {
    void filename
    const statements: StandaloneCSSDirectiveStatement[] = []
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
        if (depth !== 0 || char !== '@') continue

        const name = parseAtRuleName(source, index)
        if (!STANDALONE_CSS_DIRECTIVE_NAMES.has(name as StandaloneCSSDirectiveName)) continue
        if (isIdentChar(source[index + name.length + 1])) continue
        const statement = parseStandaloneCSSDirectiveStatement(source, index, name as StandaloneCSSDirectiveName)
        if (!statement) continue
        statements.push(statement)
        index = statement.end - 1
    }
    return statements
}

export function findStandaloneMasterDirectiveStatements(source: string, filename = 'master.css') {
    return findStandaloneCSSDirectiveStatements(source, filename)
        .filter((statement): statement is StandaloneMasterDirectiveStatement => statement.atRuleName === 'master')
}

export function collectStandaloneCSSDirectiveExtractionPolicy(source: string, filename = 'master.css') {
    void filename
    const policy = createCSSDirectiveExtractionPolicy()
    for (const statement of findStandaloneCSSDirectiveStatements(source, filename)) {
        switch (statement.atRuleName) {
            case 'source':
                if (statement.modifiers.includes('not')) {
                    policy.exclude.push(...statement.args)
                } else {
                    policy.include.push(...statement.args)
                }
                break
            case 'safelist':
                policy.safelist.push(...statement.args.flatMap((arg) => arg.split(/\s+/).filter(Boolean)))
                break
            case 'blocklist':
                policy.blocklist.push(...statement.args
                    .flatMap((arg) => arg.split(/\s+/).filter(Boolean))
                    .map(normalizeBlocklistPattern))
                break
            case 'preserve':
                if (statement.modifiers.includes('native')) {
                    policy.preserveNative = true
                }
                break
        }
    }
    return policy
}

export function removeStandaloneCSSDirectives(source: string, filename = 'master.css') {
    return removeSourceRanges(source, findStandaloneCSSDirectiveStatements(source, filename))
}

export function removeStandaloneMasterDirectives(source: string, filename = 'master.css') {
    return removeSourceRanges(source, findStandaloneMasterDirectiveStatements(source, filename))
}
