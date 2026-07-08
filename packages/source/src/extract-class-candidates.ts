import { MASTER_CSS_VALUE_UNIT_PATTERN } from '@master/css-lexer'

/**
 * Extract class-like candidates from arbitrary source content (HTML, JSX, TS,
 * Vue, Svelte, MDX). Returns unvalidated candidate class strings; downstream
 * callers validate each candidate.
 *
 * Pipeline:
 *   1. preExclude — strip JS/HTML comments, <style> blocks, import/require
 *   2. tokenize — split by whitespace into "blocks"
 *   3. for each block — split by quotation, peel out string contents
 *   4. trimString — remove leading `name=` and trailing punctuation
 *   5. needExclude — drop tokens that look like things other than classes
 *
 * Scanner implementation notes:
 *   - All regex literals are hoisted to module scope. Within a function,
 *     V8 already memoises them, but module scope makes the intent explicit
 *     and avoids accidental local rebuild.
 *   - `trimString` is iterative, so a long class with many trailing
 *     characters cannot blow the stack.
 *   - `needExclude` short-circuits via two cheap structural patterns first,
 *     then walks the explicit reject list — most input fails at the first
 *     check so we avoid 11 redundant regex evaluations.
 *   - The CSS-unit suffix list is pulled into a constant so the giant
 *     `WxH` regex isn't an inline literal repeated through the file.
 */

// ─── Sentinel (placeholder for protected string literals) ────────────────────
// The printable form keeps debug output readable. Practical collisions with
// real source require the user to literally write `COMPLETE-STRING--N--`.
const SENTINEL_PREFIX = 'COMPLETE-STRING--'
const SENTINEL_SUFFIX = '--'
const SENTINEL_REGEX = /^COMPLETE-STRING--/
const RESTORE_SENTINEL = /COMPLETE-STRING--(\d+)--/g
const MANY_COMPLETE_STRINGS = 8

// ─── Hoisted regexes ─────────────────────────────────────────────────────────
const NON_WHITESPACE_RUN = /\S+/g
const COMPLETE_STRING = /((?<!\\)["'`])(?:\\\1|(?:(?!\1))[\S\s])*(?<!\\)\1/g
const NON_QUOTE_RUN = /[^"'`]+/g
const SPLIT_SENTINEL_TEXT = 'SPLIT_BY_THIS'

const TRIM_LEADING = /^[^:@~(]*(?<!@>?)=/
const TRIM_TRAILING = /[([{\\:#=.]+$/

const PRE_EXCLUDE_BLOCK_COMMENT = /\/\*(?:(?!\*\/)[\S\s])*\*\//g
const PRE_EXCLUDE_HTML_COMMENT = /<!--(?:(?!-->)[\S\s])*-->/g
const PRE_EXCLUDE_LINE_COMMENT = /\/\/.*/g
const PRE_EXCLUDE_STYLE_TAG = /<style[^>]*>(?:(?!<\/style>)[\S\s])*<\/style>/g
const PRE_EXCLUDE_IMPORT_FROM = /import.*from\s*COMPLETE-STRING--\d+--/g
const PRE_EXCLUDE_IMPORT = /import\s*(?:COMPLETE-STRING--\d+--|\([^;\s]*\))/g
const PRE_EXCLUDE_REQUIRE = /(?:require|import)\([^;\s]*\)/g
const PRE_EXCLUDE_DECORATOR = /(?:@.*\n)+(?:export|function|class)/g

const GROUP_BODY = /{(.*)}/

// "Keep this token" patterns OR'd into one — cheaper than four separate
// `.match()` calls.
const KEEP_TOKEN = /(?:\S*\{\S*\})|(?:^[\w\-()]+:\S+)|(?:^[\w-]+\(\S+\))|(?:^[\w-]+)/

// CSS unit suffix used by the `WxH` shorthand recognizer.
const KEEP_WXH = new RegExp(`^(?:calc\\(.*\\)|\\d+(?:${MASTER_CSS_VALUE_UNIT_PATTERN})?)x(?:calc\\(.*\\)|\\d+(?:${MASTER_CSS_VALUE_UNIT_PATTERN})?)$`)

// Reject the token when any of these match. Listed in order of frequency in
// real codebases, so the loop short-circuits earlier on average.
const REJECT_PATTERNS: RegExp[] = [
  /;$/,
  /<\w+>|<\/\w+>/,
  /\$\{/,
  /\{\{/,
  /^@(?:ts-[^\s]+|charset|import|namespace|media|supports|document|page|font-face|keyframes|counter-style|font-feature-values|property|layer|[^/]+\/.*)$/,
  /^~\/.+.\w+$/,
  /^\$\(.*/,
  /^\w+:\/\//,
  /\(\{[^}]*\}/,
  /:\[/,
  /\*\*/,
  /function\(|\(.*\)=>/,
]

// ─── Helpers ────────────────────────────────────────────────────────────────

interface ProtectedContent {
  content: string
  strings: string[]
  restoreAll: boolean
}

function findCompleteString(content: string): string[] | null {
  return content?.match(COMPLETE_STRING)
}

function replaceCompleteString(content: string, completeStrings: string[]): string {
  for (let i = 0; i < completeStrings.length; i++) {
    content = content.replace(completeStrings[i], SENTINEL_PREFIX + i + SENTINEL_SUFFIX)
  }
  return content
}

function protectCompleteStrings(content: string): ProtectedContent | undefined {
  const completeStrings = findCompleteString(content)
  if (!completeStrings) return
  if (completeStrings.length < MANY_COMPLETE_STRINGS) {
    return {
      content: replaceCompleteString(content, completeStrings),
      strings: completeStrings,
      restoreAll: false
    }
  }
  let index = 0
  return {
    content: content.replace(COMPLETE_STRING, () => SENTINEL_PREFIX + index++ + SENTINEL_SUFFIX),
    strings: completeStrings,
    restoreAll: true
  }
}

function restoreAllCompleteStrings(content: string, strings: string[]): string {
  return content.replace(RESTORE_SENTINEL, (match, index: string) => strings[Number(index)] ?? match)
}

function restoreCompleteStrings(protectedContent: ProtectedContent): string {
  if (protectedContent.restoreAll) {
    return restoreAllCompleteStrings(protectedContent.content, protectedContent.strings)
  }
  let content = protectedContent.content
  for (let i = 0; i < protectedContent.strings.length; i++) {
    content = content.replace(SENTINEL_PREFIX + i + SENTINEL_SUFFIX, protectedContent.strings[i])
  }
  return content
}

function keepCompleteStringAndProcessContent(
  content: string,
  process: (content: string) => string
): string {
  const protectedContent = protectCompleteStrings(content)
  if (!protectedContent) return process(content)
  return restoreCompleteStrings({
    ...protectedContent,
    content: process(protectedContent.content)
  })
}

function splitStringByQuotation(content: string): string[] {
  const blocks = keepCompleteStringAndProcessContent(
    content,
    c => (c.match(NON_QUOTE_RUN) ?? []).join(SPLIT_SENTINEL_TEXT)
  ).split(SPLIT_SENTINEL_TEXT)
  return blocks
}

/**
 * Iteratively strip a leading `name=` prefix and trailing punctuation. The
 * loop reaches the same fixed point without stack growth on long inputs.
 */
function trimString(content: string): string {
  while (true) {
    const before = content
    content = keepCompleteStringAndProcessContent(
      content,
      c => c.replace(TRIM_LEADING, '').replace(TRIM_TRAILING, '')
    )
    if (before === content || !content) return content
  }
}

function peelCompleteString(content: string): Set<string> {
  const strings = new Set<string>()
  // Local regex per invocation: a /g flag carries lastIndex state, and
  // recursive calls would otherwise corrupt the outer iteration. Cheaper
  // than save/restore because the outer instance can stay constant.
  const stringRegex = /((?<!\\)["'`])((?:\\\1|(?:(?!\1))[\S\s])*)((?<!\\)\1)/g
  let m: RegExpExecArray | null
  while ((m = stringRegex.exec(content)) !== null) {
    if (m.index === stringRegex.lastIndex) {
      stringRegex.lastIndex++
    }
    const inner = m[2]
    strings.add(inner)
    const nested = peelCompleteString(inner)
    for (const s of nested) strings.add(s)
  }
  return strings
}

function preExclude(content: string): string {
  return keepCompleteStringAndProcessContent(
    content,
    c => c
      .replace(PRE_EXCLUDE_BLOCK_COMMENT, '')
      .replace(PRE_EXCLUDE_HTML_COMMENT, '')
      .replace(PRE_EXCLUDE_LINE_COMMENT, '')
      .replace(PRE_EXCLUDE_STYLE_TAG, '')
      .replace(PRE_EXCLUDE_IMPORT_FROM, '')
      .replace(PRE_EXCLUDE_IMPORT, '')
      .replace(PRE_EXCLUDE_REQUIRE, '')
      .replace(PRE_EXCLUDE_DECORATOR, '')
  )
}

function needExclude(content: string): boolean {
  if (!content) return true
  // Structural keep-or-reject: if neither KEEP_TOKEN nor KEEP_WXH matches,
  // this string doesn't look like a class.
  if (!KEEP_TOKEN.test(content) && !KEEP_WXH.test(content)) return true
  if (SENTINEL_REGEX.test(content)) return true
  for (let i = 0; i < REJECT_PATTERNS.length; i++) {
    if (REJECT_PATTERNS[i].test(content)) return true
  }
  return false
}

function checkToExclude(content: string): boolean {
  const protectedContent = protectCompleteStrings(content)
  const checkContent = protectedContent?.content ?? content
  const groupMatch = GROUP_BODY.exec(checkContent)
  if (groupMatch) {
    return groupMatch[1].split(';').some(needExclude)
  }
  return needExclude(checkContent) || hasUnclosedBrackets(content)
}

function hasUnclosedBrackets(content: string): boolean {
  const stack: string[] = []
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch)
    } else if (ch === ')' || ch === ']' || ch === '}') {
      const left = stack.pop()
      if (
        ch === ')' && left !== '(' ||
        ch === ']' && left !== '[' ||
        ch === '}' && left !== '{'
      ) {
        return true
      }
    }
  }
  return stack.length > 0
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function extractClassCandidates(content: string): string[] {
  content = preExclude(content)
  const blocks = content.match(NON_WHITESPACE_RUN) ?? []
  const classCandidates = new Set<string>()
  for (const block of blocks) {
    for (const splitResult of splitStringByQuotation(block)) {
      classCandidates.add(trimString(splitResult))
    }
    const peeled = peelCompleteString(block)
    if (peeled.size) {
      for (const peelResult of peeled) {
        for (const splitResult of splitStringByQuotation(peelResult)) {
          classCandidates.add(trimString(splitResult))
        }
      }
    }
  }
  const out: string[] = []
  for (const classCandidate of classCandidates) {
    if (classCandidate && !checkToExclude(classCandidate)) out.push(classCandidate)
  }
  return out
}
