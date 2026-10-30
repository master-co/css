import type { EditorRole } from './editor-content'

type Role = EditorRole | 'keyword' | 'function'
type Part = [text: string, role: Role]

/** Presentation-only colors for the CSS already returned by the language service. Never rewrites it. */
export function editorCSSParts(line: string): Part[] {
  const [, indent, body] = line.match(/^(\s*)(.*)$/)!
  if (body.startsWith('@')) {
    const keyword = body.match(/^@[\w-]+/)![0]
    const rest = body.slice(keyword.length)
    return [[indent, 'base'], [keyword, 'keyword'], ...valueParts(rest)]
  }
  if (body.endsWith('{') || body.endsWith(',')) {
    const end = body.endsWith('{') ? body.length - 1 : body.length
    return [[indent, 'base'], [body.slice(0, end), 'selector'], [body.slice(end), 'punct']]
  }
  if (body === '}') return [[indent, 'base'], ['}', 'punct']]
  const declaration = body.match(/^([\w-]+)(:\s*)(.*?)(;?)$/)
  if (declaration) return [[indent, 'base'], [declaration[1], 'property'], [declaration[2], 'punct'], ...valueParts(declaration[3]), [declaration[4], 'punct']]
  return [[line, 'base']]
}

/** Split paint roles while retaining every character, space, unit and native CSS value. */
function valueParts(value: string): Part[] {
  const parts: Part[] = []
  let cursor = 0
  for (const match of value.matchAll(/--[\w-]+|#[\da-f]{3,8}\b|-?(?:\d*\.)?\d+(?:%|[a-z]+)?|[a-z-]+(?=\()|[(){},/]/gi)) {
    if (match.index > cursor) parts.push([value.slice(cursor, match.index), 'utility'])
    const text = match[0]
    const role = text.startsWith('--') ? 'property' : /^#|^-?(?:\d|\.)/.test(text) ? 'number' : /^-?[a-z]/i.test(text) ? 'function' : 'punct'
    parts.push([text, role])
    cursor = match.index + text.length
  }
  if (cursor < value.length) parts.push([value.slice(cursor), 'utility'])
  return parts
}
