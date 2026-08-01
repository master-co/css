import type { RuntimeStyleInvalidationResult } from './runtime-style-invalidation-diagnostics'
import type { BenchmarkSample } from './types'

export function createRuntimeStyleInvalidationSamples(
  variantId: string,
  round: number,
  result: RuntimeStyleInvalidationResult
): BenchmarkSample[] {
  return [
    sample('interaction-ready-ms', variantId, round, result.interaction.elapsedMs),
    sample('style-recalculation-ms', variantId, round, result.traceMetrics.styleRecalculationMs),
    sample('layout-ms', variantId, round, result.traceMetrics.layoutMs),
    sample('paint-ms', variantId, round, result.traceMetrics.paintMs),
    sample('long-task-count', variantId, round, result.traceMetrics.longTaskCount),
    sample('runtime-mutation-ms', variantId, round, result.interaction.runtimeMutationMs),
    sample('runtime-ensure-class-rules-duration-ms', variantId, round, result.runtimeDiagnostics.runtimeAddDurationMs),
    sample('runtime-delete-class-rules-duration-ms', variantId, round, result.runtimeDiagnostics.runtimeRemoveDurationMs),
    sample('mutation-observer-callback-count', variantId, round, result.runtimeDiagnostics.mutationObserverCallbackCount),
    sample('mutation-observer-callback-duration-ms', variantId, round, result.runtimeDiagnostics.mutationObserverCallbackDurationMs),
    sample('mutation-record-count', variantId, round, result.runtimeDiagnostics.mutationRecordCount),
    sample('runtime-generated-rule-count-delta', variantId, round, result.interaction.runtimeGeneratedRuleCountDelta),
    sample('preseeded-runtime-rule-count', variantId, round, result.preparation.preseededRuntimeRuleCount),
    sample('seeded-retained-class-count', variantId, round, result.preparation.seededRetainedClassCount),
    sample('seeded-retained-rule-count', variantId, round, result.preparation.seededRetainedRuleCount),
    sample('seeded-retained-raw-bytes', variantId, round, result.preparation.seededRetainedRawBytes),
    sample('retained-set-add-count', variantId, round, result.runtimeDiagnostics.retainedSetAddCount),
    sample('retained-set-delete-count', variantId, round, result.runtimeDiagnostics.retainedSetDeleteCount),
    sample('retained-set-clear-count', variantId, round, result.runtimeDiagnostics.retainedSetClearCount),
    sample('observer-paused', variantId, round, result.preparation.observerPaused),
    sample('runtime-style-rule-count-before', variantId, round, result.beforeRuntimeStyleRuleCount),
    sample('runtime-style-rule-count-after', variantId, round, result.afterTraceRuntimeStyleRuleCount),
    sample('runtime-style-rule-count-after-flush', variantId, round, result.afterFlushRuntimeStyleRuleCount),
    sample('runtime-utility-count-before', variantId, round, result.beforeState.classUtilityNames.length),
    sample('runtime-utility-count-after', variantId, round, result.afterTraceState.classUtilityNames.length),
    sample('runtime-utility-count-after-flush', variantId, round, result.afterFlushState.classUtilityNames.length),
    sample('retained-class-count-before', variantId, round, result.beforeState.retainedClassNames.length),
    sample('retained-class-count-after', variantId, round, result.afterTraceState.retainedClassNames.length),
    sample('retained-class-count-after-flush', variantId, round, result.afterFlushState.retainedClassNames.length),
    sample('retained-rule-count-after-flush', variantId, round, result.afterFlushState.retainedClassRuleCount),
    sample('retained-raw-bytes-after-flush', variantId, round, result.afterFlushState.retainedClassRawBytes),
    sample('retained-cleanup-removed-class-count', variantId, round, result.forcedRetainedCleanup.removedClassCount),
    sample('retained-cleanup-duration-ms', variantId, round, result.forcedRetainedCleanup.durationMs),
    sample('computed-style-valid', variantId, round, result.interaction.computedStyleValid),
    sample('cleanup-valid', variantId, round, result.interaction.cleanupValid),
    sample('progressive-adopted', variantId, round, result.interaction.progressiveAdopted)
  ]
}

function sample(metricId: string, variantId: string, round: number, value: number): BenchmarkSample {
  return {
    metricId,
    variantId,
    round,
    value
  }
}
