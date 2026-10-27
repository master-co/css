import { runInNewContext } from 'node:vm'
import { expect, test } from 'vitest'
import { renderRuntimePreparationInstaller } from '../shared/runtime-preparation'

test('Set instrumentation counts calls only in the measured interval and preserves Set results', () => {
  const result = runInNewContext(`${renderRuntimePreparationInstaller()}
    const retained = new Set();
    let disconnected = 0;
    const runtime = { retainedClassNames: retained, observer: { disconnect() { disconnected++; } } };
    const metrics = { collectInteractionMutations: false };
    const controls = installBenchmarkRuntimePreparation(runtime, metrics);
    retained.add('outside'); retained.delete('outside'); retained.clear();
    metrics.collectInteractionMutations = true;
    const sameSet = retained.add('a') === retained;
    retained.add('a');
    const removed = retained.delete('a');
    const absent = retained.delete('absent');
    retained.clear();
    metrics.collectInteractionMutations = false;
    retained.add('after');
    controls.pauseObserver();
    ({sameSet, removed, absent, metrics, contents: [...retained], disconnected});`)
  expect(JSON.parse(JSON.stringify(result))).toEqual({
    sameSet: true, removed: true, absent: false,
    metrics: { collectInteractionMutations: false, retainedSetAddCount: 2, retainedSetDeleteCount: 2, retainedSetClearCount: 1 },
    contents: ['after'], disconnected: 1
  })
})

test('missing instance capabilities fail instead of silently recording zero', () => {
  expect(() => runInNewContext(`${renderRuntimePreparationInstaller()}; installBenchmarkRuntimePreparation({}, {})`)).toThrow('observed runtime instance')
})

test('pause follows the same runtime after observer replacement', () => {
  const result = runInNewContext(`${renderRuntimePreparationInstaller()}
    let first = 0, second = 0;
    const runtime = {retainedClassNames: new Set(), observer: {disconnect() {first++;}}};
    const controls = installBenchmarkRuntimePreparation(runtime, {});
    runtime.observer = {disconnect() {second++;}};
    controls.pauseObserver();
    ({first, second});`)
  expect(JSON.parse(JSON.stringify(result))).toEqual({ first: 0, second: 1 })
})
