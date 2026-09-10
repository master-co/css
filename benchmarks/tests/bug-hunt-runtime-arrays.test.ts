import { runInNewContext } from 'node:vm'
import { expect, test } from 'vitest'
import { addRuntimeHarness } from '../shared/interaction-cost-harness'
import type { RuntimeMutationStrategyId } from '../shared/interaction-cost-config'

function exercise(strategy: RuntimeMutationStrategyId, body: string) {
  const html = addRuntimeHarness('<html><head></head><body></body></html>', {
    hideUntilRuntime: false, runtimeDiagnostics: true, runtimeMutationStrategy: strategy
  })
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n')
  return JSON.parse(JSON.stringify(runInNewContext(`
    const window = globalThis;
    const performance = {now: () => 0};
    class MutationObserver {}
    const calls = [];
    class MasterCSSRuntime {
      observe() {}
      ensureClassRules(names) { calls.push({method:'ensure', owner:this.id, names:[...names]}); return {transition:'ensure'}; }
      deleteClassRules(names) { calls.push({method:'delete', owner:this.id, names:[...names]}); return {transition:'delete'}; }
    }
    window.MutationObserver = MutationObserver;
    window.MasterCSSRuntime = MasterCSSRuntime;
    ${scripts}
    const runtime = new MasterCSSRuntime(); runtime.id = 'one';
    const metrics = __interactionMetrics;
    ${body}
  `)))
}

test('baseline forwards readonly arrays and original results while counting entries and empty calls', () => {
  const result = exercise('baseline', `
    metrics.collectInteractionMutations = true;
    const names = Object.freeze(['a','a','b']);
    const ensured = runtime.ensureClassRules(names);
    const deleted = runtime.deleteClassRules(names);
    runtime.ensureClassRules(Object.freeze([])); runtime.deleteClassRules(Object.freeze([]));
    ({ensured,deleted,calls,addCount:metrics.runtimeAddClassCount,removeCount:metrics.runtimeRemoveClassCount,
      addCalls:metrics.runtimeAddCallCount,removeCalls:metrics.runtimeRemoveCallCount});`)
  expect(result).toEqual({
    ensured: { transition: 'ensure' }, deleted: { transition: 'delete' },
    calls: [
      { method: 'ensure', owner: 'one', names: ['a', 'a', 'b'] },
      { method: 'delete', owner: 'one', names: ['a', 'a', 'b'] },
      { method: 'ensure', owner: 'one', names: [] },
      { method: 'delete', owner: 'one', names: [] }
    ], addCount: 3, removeCount: 3, addCalls: 2, removeCalls: 2
  })
})

test.each(['defer-remove', 'suppress-remove-during-trace'] as const)('%s copies queued arrays and batches unique names separately per runtime', strategy => {
  const result = exercise(strategy, `
    const second = new MasterCSSRuntime(); second.id = 'two';
    metrics.collectInteractionMutations = true;
    const names = ['a','b']; runtime.deleteClassRules(names); names[0] = 'changed';
    runtime.deleteClassRules(Object.freeze(['b','c'])); runtime.deleteClassRules([]);
    second.deleteClassRules(Object.freeze(['a']));
    const beforeCalls = calls.length;
    const flushed = __flushRuntimeMutationStrategy('test');
    const repeated = __flushRuntimeMutationStrategy('again');
    ({beforeCalls,calls,flushed,repeated,removeCount:metrics.runtimeRemoveClassCount,removeCalls:metrics.runtimeRemoveCallCount});`)
  expect(result.beforeCalls).toBe(0)
  expect(result.calls).toEqual([
    { method: 'delete', owner: 'one', names: ['a', 'b', 'c'] },
    { method: 'delete', owner: 'two', names: ['a'] }
  ])
  expect(result.flushed).toMatchObject({ flushed: true, classCount: 4, callCount: 2, queuedClassCountBeforeFlush: 5 })
  expect(result.repeated).toMatchObject({ flushed: false, classCount: 0, callCount: 0 })
  expect(result.removeCount).toBe(5)
  expect(result.removeCalls).toBe(4)
})

test('outside the collection window methods execute immediately; obsolete variadic input fails before forwarding', () => {
  const result = exercise('defer-remove', `
    runtime.ensureClassRules(['a']); runtime.deleteClassRules(['a']);
    const errors = [];
    for (const method of ['ensureClassRules','deleteClassRules']) {
      try { runtime[method]('a','b'); } catch (error) { errors.push(error.message); }
    }
    ({calls,errors,add:metrics.runtimeAddClassCount,remove:metrics.runtimeRemoveClassCount,queue:metrics.runtimeRemoveQueue.length});`)
  expect(result.calls).toHaveLength(2)
  expect(result.errors).toEqual(Array(2).fill('Benchmark runtime methods require a class-name array.'))
  expect(result).toMatchObject({ add: 0, remove: 0, queue: 0 })
})
