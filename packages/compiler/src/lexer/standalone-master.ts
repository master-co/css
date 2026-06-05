import type { Rule, TokenOrValue } from 'lightningcss'
import { encodeCSS, getCSSTransform } from '../css-transform'
import { createSourceLocationResolver, findAtRuleStatementEnd, removeSourceRanges } from './source'

export interface StandaloneMasterDirectiveStatement {
    start: number
    end: number
    name: string
    statement: string
}

const STANDALONE_MASTER_DIRECTIVE_NAMES = new Set(['', 'shake', 'no-shake', 'source', 'class'])

function isWhitespaceToken(tokenOrValue: TokenOrValue) {
    return tokenOrValue.type === 'token' && tokenOrValue.value.type === 'white-space'
}

function getStandaloneMasterDirectiveName(prelude: TokenOrValue[] | undefined) {
    const firstToken = (prelude || []).find((tokenOrValue) => !isWhitespaceToken(tokenOrValue))
    if (!firstToken) return ''
    if (firstToken.type !== 'token' || firstToken.value.type !== 'ident') return
    return firstToken.value.value
}

function getUnknownRuleValue(rule: Rule) {
    return rule.type === 'unknown' ? rule.value : undefined
}

function getStandaloneMasterDirective(rule: Rule) {
    const value = getUnknownRuleValue(rule)
    if (!value || value.name !== 'master' || value.block) return
    const name = getStandaloneMasterDirectiveName(value.prelude)
    if (name === undefined || !STANDALONE_MASTER_DIRECTIVE_NAMES.has(name)) return
    return name
}

export function findStandaloneMasterDirectiveStatements(source: string, filename = 'master.css') {
    const statements: StandaloneMasterDirectiveStatement[] = []
    const resolveLocation = createSourceLocationResolver(source)
    let ruleDepth = 0
    getCSSTransform()({
        filename,
        code: encodeCSS(source),
        visitor: {
            Rule(rule) {
                if (ruleDepth === 0) {
                    const unknownRule = rule as Rule
                    const name = getStandaloneMasterDirective(unknownRule)
                    if (name !== undefined) {
                        const start = resolveLocation(getUnknownRuleValue(unknownRule)?.loc)
                        if (start === -1) return
                        const end = findAtRuleStatementEnd(source, start)
                        if (end !== -1) {
                            statements.push({
                                start,
                                end,
                                name,
                                statement: source.slice(start, end)
                            })
                        }
                    }
                }
                ruleDepth++
            },
            RuleExit() {
                ruleDepth--
            }
        }
    })
    return statements
}

export function removeStandaloneMasterDirectives(source: string, filename = 'master.css') {
    return removeSourceRanges(source, findStandaloneMasterDirectiveStatements(source, filename))
}
