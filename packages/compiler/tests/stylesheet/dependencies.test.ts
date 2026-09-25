import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { resolveStylesheetDependenciesSync } from '@master/css-compiler/node'

test('resolves immutable complete import edges without flattening qualified native CSS', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-import-dependencies-'))
  try {
    const entry = join(root, 'app.css'), child = join(root, 'child.css')
    const packageRoot = join(root, 'node_modules/@master/css'), packageJSON = join(packageRoot, 'package.json')
    await mkdir(packageRoot, { recursive: true })
    await writeFile(child, '.child{color:red}')
    await writeFile(join(packageRoot, 'first.css'), '.first{color:red}')
    await writeFile(join(packageRoot, 'second.css'), '.second{color:blue}')
    await writeFile(packageJSON, JSON.stringify({ name: '@master/css', style: './first.css' }))
    const realPackageRoot = await realpath(packageRoot)
    const source = '@import "@master/css";@import "./child.css" layer(card) supports(display: grid) screen;'
    const first = resolveStylesheetDependenciesSync(entry, source, { projectDir: root })
    expect(first.dependencies).toEqual([entry, join(realPackageRoot, 'first.css'), child])
    expect(first.edges).toContainEqual({ from: entry, specifier: '@master/css', resolved: join(realPackageRoot, 'first.css') })
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.dependencies)).toBe(true)
    expect(Object.isFrozen(first.edges[0])).toBe(true)
    await writeFile(packageJSON, JSON.stringify({ name: '@master/css', style: './second.css' }))
    expect(resolveStylesheetDependenciesSync(entry, source, { projectDir: root }).edges[0].resolved).toBe(join(realPackageRoot, 'second.css'))
    await rm(child)
    expect(() => resolveStylesheetDependenciesSync(entry, source, { projectDir: root })).toThrow()
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('dependency resolution honors cancellation', () => {
  expect(() => resolveStylesheetDependenciesSync('/project/app.css', '@master entry;', { signal: AbortSignal.abort() })).toThrow()
})


test('identifies reference context without treating native strings as references', () => {
  expect(resolveStylesheetDependenciesSync('/project/app.css', '@reference "./theme.css";').hasReferences).toBe(true)
  expect(resolveStylesheetDependenciesSync('/project/app.css', '.probe{content:"@reference"}').hasReferences).toBe(false)
})
