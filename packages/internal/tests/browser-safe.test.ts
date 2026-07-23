import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const BROWSER_SAFE_SOURCES = [
  'index.ts',
  'module.ts',
  'manifest-module.ts',
  'manifest-facade.ts',
  'style-module.ts',
  'emitted-globals-module.ts'
]

function stripStringAndCommentContent(source: string) {
  let result = ''
  let index = 0
  let mode: 'code' | 'single' | 'double' | 'template' | 'line-comment' | 'block-comment' = 'code'
  while (index < source.length) {
    const current = source[index]
    const next = source[index + 1]
    if (mode === 'code') {
      if (current === '/' && next === '/') {
        result += '  '
        index += 2
        mode = 'line-comment'
        continue
      }
      if (current === '/' && next === '*') {
        result += '  '
        index += 2
        mode = 'block-comment'
        continue
      }
      if (current === '\'') {
        result += ' '
        index += 1
        mode = 'single'
        continue
      }
      if (current === '"') {
        result += ' '
        index += 1
        mode = 'double'
        continue
      }
      if (current === '`') {
        result += ' '
        index += 1
        mode = 'template'
        continue
      }
      result += current
      index += 1
      continue
    }
    if (mode === 'line-comment') {
      result += current === '\n' ? '\n' : ' '
      index += 1
      if (current === '\n') mode = 'code'
      continue
    }
    if (mode === 'block-comment') {
      result += current === '\n' ? '\n' : ' '
      index += 1
      if (current === '*' && next === '/') {
        result += ' '
        index += 1
        mode = 'code'
      }
      continue
    }
    result += current === '\n' ? '\n' : ' '
    index += 1
    if (current === '\\') {
      result += next === '\n' ? '\n' : ' '
      index += 1
      continue
    }
    if (
      (mode === 'single' && current === '\'')
      || (mode === 'double' && current === '"')
      || (mode === 'template' && current === '`')
    ) {
      mode = 'code'
    }
  }
  return result
}

describe('@master/css-internal browser-safe sources', () => {
  it('keeps browser-safe subpaths free of static Node dependencies', () => {
    for (const file of BROWSER_SAFE_SOURCES) {
      const source = readFileSync(path.resolve(__dirname, '../src', file), 'utf8')
      expect(source, file).not.toMatch(/^\s*(?:import|export)\b.*\bfrom\s+['"]node:/m)
      const codeOnly = stripStringAndCommentContent(source)
      expect(codeOnly, file).not.toMatch(/(^|[^\w$])(?:Buffer|process)([^\w$]|$)/)
    }
  })
})
