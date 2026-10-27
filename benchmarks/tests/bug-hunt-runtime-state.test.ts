import { runInNewContext } from 'node:vm'
import type { MasterCSSRuntimeSnapshot } from '@master/css-runtime'
import { expect, test } from 'vitest'
import { renderRuntimeSnapshotReader, summarizeRuntimeSnapshot } from '../shared/runtime-state'

const snapshot: MasterCSSRuntimeSnapshot = {
  binding: 'wasm', observing: true,
  cssText: '@layer utilities{.a{content:"é"}.b{color:red}}',
  usageCounts: { a: 1, marker: 2 },
  classRules: {
    a: { usageCount: 1, retained: false, rules: [{ key: 'a', layer: 'utilities', text: '.a{content:"é"}' }] },
    marker: { usageCount: 2, retained: false, rules: [] },
    b: { usageCount: 0, retained: true, rules: [
      { key: 'shared', layer: 'utilities', text: '.b,.alias{color:red}' },
      { key: 'second', layer: 'utilities', text: '.b{content:"龍"}' }
    ] },
    alias: { usageCount: 0, retained: true, rules: [
      { key: 'shared', layer: 'utilities', text: '.b,.alias{color:red}' }
    ] }
  },
  layers: [
    { name: 'utilities', ruleCount: 3, cssText: '' },
    { name: 'theme', ruleCount: 1, cssText: '' },
    { name: 'keyframes', ruleCount: 1, cssText: '' }
  ],
  hydration: { state: 'progressive', manifestLoaded: true }
}

test('counts output entries, including non-class layers, independently of class names', () => {
  const result = summarizeRuntimeSnapshot(snapshot)
  expect(result.runtimeGeneratedRuleCount).toBe(5)
  expect(result.classUtilityNames).toEqual(['a', 'alias', 'b'])
  expect(result.classCounts).toEqual({ a: 1, marker: 2 })
  expect(result.runtimeStyleRawBytes).toBe(Buffer.byteLength(snapshot.cssText))
  expect(result.runtimeStyleRawBytes).toBeGreaterThan(snapshot.cssText.length)
  expect(result.progressiveAdopted).toBe(1)
})

test('retained classes share a rule identity without double-counting bytes or output entries', () => {
  const result = summarizeRuntimeSnapshot(snapshot)
  expect(result.retainedClassNames).toEqual(['alias', 'b'])
  expect(result.retainedClassRuleCount).toBe(2)
  expect(result.retainedClassRawBytes).toBe(Buffer.byteLength('.b,.alias{color:red}.b{content:"龍"}'))
  result.classCounts.a = 999
  expect(snapshot.usageCounts.a).toBe(1)
})

test('absent runtime is a static page, while explicit fallback keeps its diagnostic', () => {
  const absent = summarizeRuntimeSnapshot()
  expect(absent.runtimeAvailable).toBe(false)
  expect(absent.runtimeGeneratedRuleCount).toBe(0)
  expect(absent.runtimeStyleRawBytes).toBe(0)
  expect(absent.retainedClassNames).toEqual([])
  const fallback = summarizeRuntimeSnapshot({ ...snapshot, hydration: { state: 'runtime', manifestLoaded: true, failureReason: 'invalid rule' } })
  expect(fallback.progressiveAdopted).toBe(0)
  expect(fallback.hydrationFailureReason).toBe('invalid rule')
})

test('generated browser reader executes with only the public facade and platform globals', () => {
  const facade = Object.freeze({ snapshot: () => snapshot })
  const context = { masterCSSRuntime: facade, TextEncoder }
  const result = runInNewContext(`${renderRuntimeSnapshotReader()}; __readBenchmarkRuntimeSnapshot()`, context)
  expect(JSON.parse(JSON.stringify(result))).toEqual(summarizeRuntimeSnapshot(snapshot))
  expect(Object.keys(facade)).toEqual(['snapshot'])
})
