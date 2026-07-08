import {
  createSourceLocationResolver,
  findCSSStatementEnd,
  removeSourceRanges,
  replaceSourceRanges,
  type SourceRange
} from '@master/css-lexer'

export {
  createSourceLocationResolver,
  removeSourceRanges,
  replaceSourceRanges,
  type SourceRange
}

export function findAtRuleStatementEnd(source: string, start: number) {
  const statementEnd = findCSSStatementEnd(source, start)
  return statementEnd.reason === 'semicolon' ? statementEnd.end : -1
}
