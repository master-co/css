import { expect, test } from 'vitest'
import { staticWatchIgnores } from '../src/static-watch'

test('publication bookkeeping never feeds back into the project watcher; CSS and state remain inputs', () => {
  const ignored = staticWatchIgnores(/node_modules/i) as RegExp
  for (const name of ['publish.lock', 'publish.lock.recovery', 'next-static-publication.json', 'next-static-inputs.json', 'next-static-scanned-sources.log', 'next.css.tmp-uuid']) {
    expect(ignored.test(`/project/.master/${name}`), name).toBe(true)
    expect(ignored.test(`C:\\project\\.master\\${name}`), name).toBe(true)
  }
  for (const name of ['next.css', 'next-style-content.css', 'next-resource-content.svg', 'next-static-state.json']) expect(ignored.test(`/project/.master/${name}`), name).toBe(false)
  expect(ignored.test('/project/NODE_MODULES/test.js')).toBe(true)
  expect(ignored.flags).toBe('i')
})

test('preserves user glob ignores without converting their semantics', () => {
  for (const input of ['**/vendor/**', ['**/vendor/**', '**/cache/**']]) {
    const patterns = staticWatchIgnores(input) as string[]
    expect(patterns.slice(0, typeof input === 'string' ? 1 : 2)).toEqual(typeof input === 'string' ? [input] : input)
    expect(patterns).toContain('**/.master/publish.lock')
    expect(patterns).not.toContain('**/.master/**')
  }
})
