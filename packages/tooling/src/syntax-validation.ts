import { parse, tokenize, tokenTypes, version } from 'css-tree'
import type { MasterCSSSyntaxStatus } from '@master/css-binding/tooling'

export const CSS_SYNTAX_CHECK = Object.freeze({ name: 'css-tree', version, phase: 'css-syntax' as const, scope: 'selectors-queries-declarations' as const })

/** Token structure is independent of property grammars and browser support. */
export function cssSyntaxStatus(text: string): MasterCSSSyntaxStatus {
  const stack: number[] = []
  let invalid = false
  tokenize(text, (type, start, end) => {
    switch (type) {
      case tokenTypes.Function:
      case tokenTypes.LeftParenthesis: stack.push(tokenTypes.RightParenthesis); break
      case tokenTypes.LeftSquareBracket: stack.push(tokenTypes.RightSquareBracket); break
      case tokenTypes.LeftCurlyBracket: stack.push(tokenTypes.RightCurlyBracket); break
      case tokenTypes.RightParenthesis:
      case tokenTypes.RightSquareBracket:
      case tokenTypes.RightCurlyBracket: invalid ||= stack.pop() !== type; break
      case tokenTypes.BadString:
      case tokenTypes.BadUrl: invalid = true; break
      case tokenTypes.Comment: invalid ||= text.slice(end - 2, end) !== '*/'; break
      case tokenTypes.String: invalid ||= text[end - 1] !== text[start] || end - start < 2; break
    }
  })
  if (invalid || stack.length) return 'invalid'
  try {
    let unknown = false
    const ast = parse(text, { parseCustomProperty: false, onParseError: () => { unknown = true } })
    // Parsing checks syntax, not whether the browser implements it. css-tree's
    // inability to parse a future construct is incomplete knowledge, not invalidity.
    return ast && !unknown ? 'valid' : 'unknown'
  } catch {
    return 'unknown'
  }
}
