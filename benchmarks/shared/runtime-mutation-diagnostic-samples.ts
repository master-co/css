import type { RuntimeState } from './interaction-cost'
import type { RuntimeMutationDiagnosticResult } from './runtime-mutation-diagnostics'
import type { BenchmarkSample } from './types'

export function createRuntimeMutationDiagnosticSamples(
  variantId: string,
  round: number,
  result: RuntimeMutationDiagnosticResult
): BenchmarkSample[] {
  const details = result.interaction.details
  const tempClassNames = getTemporaryClassNames()
  return [
    {
      metricId: 'interaction-ready-ms',
      variantId,
      round,
      value: result.interaction.elapsedMs
    },
    {
      metricId: 'style-recalculation-ms',
      variantId,
      round,
      value: result.traceMetrics.styleRecalculationMs
    },
    {
      metricId: 'layout-ms',
      variantId,
      round,
      value: result.traceMetrics.layoutMs
    },
    {
      metricId: 'paint-ms',
      variantId,
      round,
      value: result.traceMetrics.paintMs
    },
    {
      metricId: 'long-task-count',
      variantId,
      round,
      value: result.traceMetrics.longTaskCount
    },
    {
      metricId: 'runtime-mutation-ms',
      variantId,
      round,
      value: result.interaction.runtimeMutationMs
    },
    {
      metricId: 'runtime-ensure-class-rules-duration-ms',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeAddDurationMs
    },
    {
      metricId: 'runtime-delete-class-rules-duration-ms',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeRemoveDurationMs
    },
    {
      metricId: 'runtime-ensure-class-rules-call-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeAddCallCount
    },
    {
      metricId: 'runtime-delete-class-rules-call-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeRemoveCallCount
    },
    {
      metricId: 'runtime-ensured-class-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeAddClassCount
    },
    {
      metricId: 'runtime-deleted-class-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeRemoveClassCount
    },
    {
      metricId: 'runtime-deferred-remove-call-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeDeferredRemoveCallCount
    },
    {
      metricId: 'runtime-deferred-remove-class-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeDeferredRemoveClassCount
    },
    {
      metricId: 'runtime-suppressed-remove-call-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeSuppressedRemoveCallCount
    },
    {
      metricId: 'runtime-suppressed-remove-class-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeSuppressedRemoveClassCount
    },
    {
      metricId: 'runtime-flush-remove-call-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeFlushRemoveCallCount
    },
    {
      metricId: 'runtime-flush-remove-class-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeFlushRemoveClassCount
    },
    {
      metricId: 'runtime-flush-remove-duration-ms',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeFlushRemoveDurationMs
    },
    {
      metricId: 'runtime-queued-remove-class-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.runtimeQueuedRemoveClassCount
    },
    {
      metricId: 'mutation-observer-callback-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.mutationObserverCallbackCount
    },
    {
      metricId: 'mutation-record-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.mutationRecordCount
    },
    {
      metricId: 'mutation-added-node-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.mutationAddedNodeCount
    },
    {
      metricId: 'mutation-removed-node-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.mutationRemovedNodeCount
    },
    {
      metricId: 'mutation-class-attribute-count',
      variantId,
      round,
      value: result.runtimeDiagnostics.mutationClassAttributeCount
    },
    {
      metricId: 'mutation-cycle-count',
      variantId,
      round,
      value: numberDetail(details.mutationCycleCount)
    },
    {
      metricId: 'append-count',
      variantId,
      round,
      value: numberDetail(details.appendCount)
    },
    {
      metricId: 'post-interaction-settle-frame-count',
      variantId,
      round,
      value: result.postInteractionSettleFrameCount
    },
    {
      metricId: 'preseeded-runtime-rule-count',
      variantId,
      round,
      value: result.preseededRuntimeRuleCount
    },
    {
      metricId: 'removed-node-count',
      variantId,
      round,
      value: numberDetail(details.removedNodeCount)
    },
    {
      metricId: 'affected-element-count',
      variantId,
      round,
      value: result.interaction.affectedElementCount
    },
    {
      metricId: 'dom-node-count',
      variantId,
      round,
      value: result.interaction.domNodeCount
    },
    {
      metricId: 'runtime-class-count-before',
      variantId,
      round,
      value: Object.keys(result.beforeState.classCounts).length
    },
    {
      metricId: 'runtime-class-count-after',
      variantId,
      round,
      value: Object.keys(result.afterTraceState.classCounts).length
    },
    {
      metricId: 'runtime-utility-count-before',
      variantId,
      round,
      value: result.beforeState.classUtilityNames.length
    },
    {
      metricId: 'runtime-utility-count-after',
      variantId,
      round,
      value: result.afterTraceState.classUtilityNames.length
    },
    {
      metricId: 'temporary-class-count-before',
      variantId,
      round,
      value: countTemporaryClasses(result.beforeState, tempClassNames)
    },
    {
      metricId: 'temporary-class-count-after',
      variantId,
      round,
      value: countTemporaryClasses(result.afterTraceState, tempClassNames)
    },
    {
      metricId: 'runtime-class-count-after-flush',
      variantId,
      round,
      value: Object.keys(result.afterFlushState.classCounts).length
    },
    {
      metricId: 'runtime-utility-count-after-flush',
      variantId,
      round,
      value: result.afterFlushState.classUtilityNames.length
    },
    {
      metricId: 'retained-class-count-before',
      variantId,
      round,
      value: result.beforeState.retainedClassNames.length
    },
    {
      metricId: 'retained-class-count-after',
      variantId,
      round,
      value: result.afterTraceState.retainedClassNames.length
    },
    {
      metricId: 'retained-class-count-after-flush',
      variantId,
      round,
      value: result.afterFlushState.retainedClassNames.length
    },
    {
      metricId: 'retained-class-count-after-forced-cleanup',
      variantId,
      round,
      value: result.afterForcedCleanupState.retainedClassNames.length
    },
    {
      metricId: 'retained-rule-count-after-flush',
      variantId,
      round,
      value: result.afterFlushState.retainedClassRuleCount
    },
    {
      metricId: 'retained-raw-bytes-after-flush',
      variantId,
      round,
      value: result.afterFlushState.retainedClassRawBytes
    },
    {
      metricId: 'retained-cleanup-removed-class-count',
      variantId,
      round,
      value: result.forcedRetainedCleanup.removedClassCount
    },
    {
      metricId: 'retained-cleanup-duration-ms',
      variantId,
      round,
      value: result.forcedRetainedCleanup.durationMs
    },
    {
      metricId: 'temporary-class-count-after-flush',
      variantId,
      round,
      value: countTemporaryClasses(result.afterFlushState, tempClassNames)
    },
    {
      metricId: 'runtime-generated-rule-count-delta',
      variantId,
      round,
      value: result.interaction.runtimeGeneratedRuleCountDelta
    },
    {
      metricId: 'runtime-style-raw-bytes-delta',
      variantId,
      round,
      value: result.interaction.runtimeStyleRawBytesDelta
    },
    {
      metricId: 'computed-style-valid',
      variantId,
      round,
      value: result.interaction.computedStyleValid
    },
    {
      metricId: 'cleanup-valid',
      variantId,
      round,
      value: result.cleanupAfterFlush.cleanupValid
    },
    {
      metricId: 'cleanup-valid-during-trace',
      variantId,
      round,
      value: result.interaction.cleanupValid
    },
    {
      metricId: 'cleanup-valid-after-flush',
      variantId,
      round,
      value: result.cleanupAfterFlush.cleanupValid
    },
    {
      metricId: 'progressive-adopted',
      variantId,
      round,
      value: result.interaction.progressiveAdopted
    }
  ]
}

export function countTemporaryClasses(state: RuntimeState, temporaryClassNames: string[]) {
  return temporaryClassNames.reduce((total, className) => total + (state.classCounts[className] || 0), 0)
}

export function getTemporaryClassNames() {
  return [
    'fg:green-60',
    'w:1px'
  ]
}

function numberDetail(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}
