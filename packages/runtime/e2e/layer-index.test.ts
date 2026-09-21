import { expect, test } from '@playwright/test'
import init from './init'

test('1,000 single-node insertions avoid repeated key searches and prefix reads', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const { utilitiesLayer: layer } = runtime as unknown as { utilitiesLayer: { rules: unknown[] } }
    let indexedReads = 0
    let linearSearches = 0
    Object.defineProperty(layer, 'rules', { value: new Proxy(layer.rules, {
      get(target, property, receiver) {
        if (typeof property === 'string' && /^\d+$/.test(property)) indexedReads++
        if (property === 'some' || property === 'find' || property === 'findIndex') linearSearches++
        return Reflect.get(target, property, receiver)
      }
    }) })
    const classes = Array.from({ length: 1000 }, (_, index) => `w:${1000 + index}px`)
    runtime.ensureClassRules(classes)
    const result = { indexedReads, linearSearches, rules: layer.rules.length }
    runtime.deleteClassRules(classes.slice(-1))
    runtime.ensureClassRules(classes.slice(-1))
    return result
  })
  expect(result.rules).toBe(1000)
  expect(result.linearSearches).toBe(0)
  expect(result.indexedReads).toBeLessThan(3000)
})

test('mixed node counts preserve CSSOM order across middle and tail changes, refresh and reset', async ({ page }) => {
  await init(page, undefined, {
    utilities: ['base', 'defaults', 'components', 'utilities'].flatMap((layer) =>
      ['a', 'b', 'c', 'd'].map((suffix, order) => ({
        name: `${layer}-${suffix}`,
        layer: layer as 'base' | 'defaults' | 'components' | 'utilities',
        order,
        rules: order % 2 ? [{ declarations: { display: 'block' } }] : [
          { selector: '&', declarations: { color: 'red' } },
          { selector: '&:hover', declarations: { color: 'blue' } },
          { selector: '&:focus', declarations: { color: 'green' } }
        ]
      }))
    )
  })
  const states = await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const states: boolean[] = []
    const names = (suffixes: string[]) => ['base', 'defaults', 'components', 'utilities']
      .flatMap(layer => suffixes.map(suffix => `${layer}-${suffix}`))
    const check = () => {
      const expected = document.createElement('style')
      expected.media = 'not all'
      expected.textContent = runtime.snapshot().cssText
      document.head.append(expected)
      const actual = document.querySelector<HTMLStyleElement>('#master-css')!.sheet!
      states.push(JSON.stringify([...actual.cssRules].map(rule => rule.cssText))
        === JSON.stringify([...expected.sheet!.cssRules].map(rule => rule.cssText)))
      expected.remove()
    }
    for (const suffixes of [['b', 'd'], ['a'], ['c']]) {
      runtime.ensureClassRules(names(suffixes))
      check()
    }
    for (const suffixes of [['a'], ['c'], ['d']]) {
      runtime.deleteClassRules(names(suffixes))
      check()
    }
    runtime.ensureClassRules(names(['a', 'c', 'd']))
    check()
    runtime.refresh()
    check()
    runtime.disconnect().observe()
    runtime.ensureClassRules(names(['c', 'a', 'b', 'd']))
    check()
    return states
  })
  expect(states).toEqual(Array(9).fill(true))
})

test('shared rule ownership only updates referring classes', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    type Rule = { key: string }
    const host = runtime as unknown as {
      classUtilities: Map<string, Rule[]>
      utilitiesLayer: { get(key: string): Rule }
      syncClassReferences(classes: { className: string, references: { layer: string, key: string }[] }[]): void
    }
    runtime.ensureClassRules(['block', 'hidden'])
    // Exercise the host contract for bindings whose classes share stored rules.
    host.syncClassReferences([{ className: 'shared', references: [{ layer: 'utilities', key: 'block' }] }])
    host.syncClassReferences([{ className: 'shared', references: [] }])
    const singleOwnerPreserved = host.classUtilities.get('block')?.[0] === host.utilitiesLayer.get('block')
    host.syncClassReferences([{ className: 'shared', references: [{ layer: 'utilities', key: 'block' }] }])
    const unrelated = host.classUtilities.get('hidden')
    runtime.deleteClassRules(['block'])
    return {
      removed: !host.classUtilities.has('shared') && !host.classUtilities.has('block'),
      singleOwnerPreserved,
      unrelatedPreserved: host.classUtilities.get('hidden') === unrelated,
      hiddenIndexed: host.utilitiesLayer.get('hidden') === unrelated?.[0]
    }
  })
  expect(result).toEqual({ removed: true, singleOwnerPreserved: true, unrelatedPreserved: true, hiddenIndexed: true })
})
