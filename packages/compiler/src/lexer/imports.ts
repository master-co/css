import type { Rule } from 'lightningcss'
import { encodeCSS, getCSSTransform } from '../css-transform'
import { maskManagedPatternEntryNames } from '../core'
import { createSourceLocationResolver, findAtRuleStatementEnd, removeSourceRanges, replaceSourceRanges } from './source'

export interface CSSImportStatement {
    start: number
    end: number
    source: string
    statement: string
    rule: Extract<Rule, { type: 'import' }>
}

export function findCSSImportStatements(source: string, filename = 'master.css') {
    const statements: CSSImportStatement[] = []
    const maskedSource = maskManagedPatternEntryNames(source)
    const resolveLocation = createSourceLocationResolver(maskedSource)
    getCSSTransform()({
        filename,
        code: encodeCSS(maskedSource),
        visitor: {
            Rule: {
                import(rule) {
                    const start = resolveLocation(rule.value.loc)
                    if (start === -1) return
                    const end = findAtRuleStatementEnd(source, start)
                    if (end === -1) return
                    statements.push({
                        start,
                        end,
                        source: rule.value.url,
                        statement: source.slice(start, end),
                        rule
                    })
                }
            }
        }
    })
    return statements
}

export function removeCSSImportStatements(source: string, filename = 'master.css') {
    return removeSourceRanges(source, findCSSImportStatements(source, filename))
}

export function replaceCSSImportStatements(
    source: string,
    filename: string,
    getReplacement: (statement: CSSImportStatement) => string | undefined
) {
    const replacements = findCSSImportStatements(source, filename)
        .map((statement) => ({
            ...statement,
            replacement: getReplacement(statement) ?? statement.statement
        }))
    return replaceSourceRanges(source, replacements)
}
