// Locate structure in JavaScript and TypeScript config files without a parser:
// brackets are matched while strings, template literals and comments are skipped.

/** A config edit setup cannot make safely; the user applies it by hand. */
export class ManualSetupStep extends Error {}

/** The index after the code construct starting at `index` that is not code: a string, template literal or comment. */
function skipNonCode(source: string, index: number): number | undefined {
  const char = source[index]
  if (char === '/' && source[index + 1] === '/') {
    const end = source.indexOf('\n', index)
    return end === -1 ? source.length : end
  }
  if (char === '/' && source[index + 1] === '*') {
    const end = source.indexOf('*/', index + 2)
    return end === -1 ? source.length : end + 2
  }
  if (char === '\'' || char === '"') {
    let cursor = index + 1
    while (cursor < source.length && source[cursor] !== char && source[cursor] !== '\n') cursor += source[cursor] === '\\' ? 2 : 1
    return cursor + 1
  }
  if (char === '`') {
    let cursor = index + 1
    while (cursor < source.length && source[cursor] !== '`') {
      if (source[cursor] === '\\') cursor += 2
      else if (source[cursor] === '$' && source[cursor + 1] === '{') {
        const end = matchingBracket(source, cursor + 1)
        if (end === undefined) return source.length
        cursor = end + 1
      } else cursor++
    }
    return cursor + 1
  }
}

const closers: Record<string, string> = { '{': '}', '[': ']', '(': ')' }

/** The index of the bracket that closes the one at `open`. */
export function matchingBracket(source: string, open: number): number | undefined {
  const stack = [closers[source[open]]]
  let cursor = open + 1
  while (cursor < source.length) {
    const skipped = skipNonCode(source, cursor)
    if (skipped !== undefined) {
      cursor = skipped
      continue
    }
    const char = source[cursor]
    if (closers[char]) stack.push(closers[char])
    else if (char === '}' || char === ']' || char === ')') {
      if (stack.pop() !== char) return undefined
      if (!stack.length) return cursor
    }
    cursor++
  }
}

/** The end of the expression starting at `start`: the first `;`, or line break, outside brackets. */
export function expressionEnd(source: string, start: number): number {
  let cursor = start
  while (cursor < source.length) {
    const skipped = skipNonCode(source, cursor)
    if (skipped !== undefined) {
      cursor = skipped
      continue
    }
    const char = source[cursor]
    if (closers[char]) {
      const end = matchingBracket(source, cursor)
      if (end === undefined) return source.length
      cursor = end + 1
      continue
    }
    if (char === ';' || char === '\n') return cursor
    cursor++
  }
  return cursor
}

/** Whether a config is a CommonJS module, which setup must not give ES imports. */
export function isCommonJS(source: string) {
  return /\bmodule\.exports\s*=|\bexports\.[\w$]+\s*=/.test(source) && !/^\s*(?:import|export)\b/m.test(source)
}

/**
 * The `{` of the exported config object: the object passed to `defineConfig(` (or
 * the named factory), an exported object literal, or the object bound to the
 * exported name.
 */
export function findConfigObject(source: string, factories: readonly string[] = ['defineConfig']): number | undefined {
  const factory = new RegExp(`\\b(?:${factories.join('|')})\\(\\s*\\{`)
  const literal = /\bexport\s+default\s+\{/
  for (const pattern of [factory, literal]) {
    const match = pattern.exec(source)
    if (match) return match.index + match[0].length - 1
  }
  const name = /\bexport\s+default\s+([A-Za-z_$][\w$]*)\s*;?\s*$/m.exec(source)?.[1]
  if (!name) return
  const binding = new RegExp(`\\b(?:const|let|var)\\s+${name.replace(/\$/g, '\\$')}\\b[^=]*=\\s*(?:(?:${factories.join('|')})\\(\\s*)?\\{`).exec(source)
  if (binding) return binding.index + binding[0].length - 1
}

/** The index right after `[` of the top-level `name: [` property of the object opening at `open`. */
export function findTopLevelArray(source: string, open: number, name: string): number | undefined {
  const close = matchingBracket(source, open)
  if (close === undefined) return
  const property = new RegExp(`^(?:${name}|['"]${name}['"])\\s*:\\s*\\[`)
  let cursor = open + 1
  while (cursor < close) {
    const skipped = skipNonCode(source, cursor)
    if (skipped !== undefined) {
      cursor = skipped
      continue
    }
    const char = source[cursor]
    if (closers[char]) {
      cursor = (matchingBracket(source, cursor) ?? close) + 1
      continue
    }
    if (/[A-Za-z_$'"]/.test(char) && !/[\w$.]/.test(source[cursor - 1] ?? '')) {
      const match = property.exec(source.slice(cursor, close))
      if (match) return cursor + match[0].length
    }
    cursor++
  }
}

/**
 * Add `entry` first to the top-level array property `name` of the config object,
 * creating the property when it is missing. Returns undefined without a config object.
 */
export function addToConfigArray(source: string, name: string, entry: string, options: { factories?: readonly string[], entryIndent: string, propertyIndent: string }): string | undefined {
  const open = findConfigObject(source, options.factories)
  if (open === undefined || matchingBracket(source, open) === undefined) return
  const array = findTopLevelArray(source, open, name)
  if (array !== undefined) return `${source.slice(0, array)}\n${options.entryIndent}${entry},${source.slice(array)}`
  return `${source.slice(0, open + 1)}\n${options.propertyIndent}${name}: [${entry}],${source.slice(open + 1)}`
}
