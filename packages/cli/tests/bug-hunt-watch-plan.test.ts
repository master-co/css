import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import fg from 'fast-glob'
import { expect, test } from 'vitest'
import { createSourceWatchPlan } from '../src/source-watch'

test('BH-0019 watch matching agrees with initial discovery and prunes ignored trees', () => {
  const cwd = fs.mkdtempSync(path.join(tmpdir(), 'master-css-watch-plan-'))
  const files = ['index.html', 'src/a.html', 'src/nested/a.mjs', 'src/skip/a.html', 'src/.hidden.html', 'node_modules/pkg/a.html', 'out/a.html', 'src/a.json']
  try {
    for (const file of files) {
      fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true })
      fs.writeFileSync(path.join(cwd, file), '')
    }
    for (const patterns of [
      ['**/*.{html,mjs}'],
      ['src/**/*.{html,mjs}', '!src/skip/**'],
      ['src/!(skip)/*.mjs'],
      ['src/.hidden.html', 'index.html'],
      [path.join(cwd, 'src/**/*.html')],
      ['src\\**\\*.mjs']
    ]) {
      const ignore = ['**/node_modules/**', '**/out/**']
      const plan = createSourceWatchPlan(fg, cwd, patterns, ignore)
      const expected = fg.sync(patterns.map(value => value.replace(/\\/g, '/')), { cwd, ignore, absolute: true }).sort()
      const actual = files.map(file => path.join(cwd, file)).filter(plan.matches).sort()
      expect(actual, patterns.join(',')).toEqual(expected)
      expect(plan.ignored(path.join(cwd, 'node_modules'), fs.statSync(path.join(cwd, 'node_modules')))).toBe(true)
      expect(plan.ignored(path.join(cwd, 'out'), fs.statSync(path.join(cwd, 'out')))).toBe(true)
    }
    const future = createSourceWatchPlan(fg, cwd, ['future/deep/**/*.html'], [])
    expect(future.roots).toEqual([cwd])
    expect(future.ignored(path.join(cwd, 'src'), fs.statSync(path.join(cwd, 'src')))).toBe(true)
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
})
