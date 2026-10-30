import type { EditorRole } from './editor-content'

type Role = EditorRole | 'keyword' | 'function'
type Part = [text: string, role: Role]

/**
 * Presentation-only colors for the CSS already returned by the language service, in the roles the docs' syntax
 * palette gives native CSS. Never rewrites it.
 */
export function editorCSSParts(line: string): Part[] {
  const [, indent, body] = line.match(/^(\s*)(.*)$/)!
  if (body.startsWith('@')) {
    const keyword = body.match(/^@[\w-]+/)![0]
    const rest = body.slice(keyword.length)
    return [[indent, 'base'], [keyword, 'keyword'], ...(/^@(?:media|container)$/.test(keyword) ? queryParts(rest) : valueParts(rest))]
  }
  if (body.endsWith('{') || body.endsWith(',')) {
    const end = body.endsWith('{') ? body.length - 1 : body.length
    return [[indent, 'base'], ...selectorParts(body.slice(0, end)), [body.slice(end), 'punct']]
  }
  if (body === '}') return [[indent, 'base'], ['}', 'punct']]
  const declaration = body.match(/^([\w-]+)(:\s*)(.*?)(;?)$/)
  if (declaration) return [[indent, 'base'], [declaration[1], 'property'], [declaration[2], 'punct'], ...valueParts(declaration[3]), [declaration[4], 'punct']]
  return [[line, 'base']]
}

/** Split `text` at every match, keeping all characters; unmatched runs take `rest`. */
function paint(text: string, pattern: RegExp, role: (match: string) => Role, rest: Role): Part[] {
  const parts: Part[] = []
  let cursor = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) parts.push([text.slice(cursor, match.index), rest])
    parts.push([match[0], role(match[0])])
    cursor = match.index + match[0].length
  }
  if (cursor < text.length) parts.push([text.slice(cursor), rest])
  return parts
}

/** Pseudo-classes and pseudo-elements read as keywords; escaped characters stay in the class name. */
function selectorParts(selector: string): Part[] {
  return paint(selector, /(?<!\\)::?[a-z-]+|,/gi, (text) => text === ',' ? 'punct' : 'keyword', 'selector')
}

/** Query features read as properties and comparisons as punctuation. */
function queryParts(prelude: string): Part[] {
  return paint(prelude, /[a-z-]+(?=\s*(?:[<>=:]|\)))|-?(?:\d*\.)?\d+(?:%|[a-z]+)?|[<>]=?|[=:(),{}]/gi, (text) => {
    if (/^-?(?:\d|\.)/.test(text)) return 'number'
    return /^[a-z-]+$/i.test(text) ? 'property' : 'punct'
  }, 'utility')
}

/** Split paint roles while retaining every character, space, unit and native CSS value; `var()` arguments stay plain. */
function valueParts(value: string): Part[] {
  return paint(value, /--[\w-]+|#[\da-f]{3,8}\b|-?(?:\d*\.)?\d+(?:%|[a-z]+)?|[a-z-]+(?=\()|[(){},/]/gi, (text) => {
    if (text.startsWith('--')) return 'utility'
    if (/^#|^-?(?:\d|\.)/.test(text)) return 'number'
    return /^-?[a-z]/i.test(text) ? 'function' : 'punct'
  }, 'utility')
}
