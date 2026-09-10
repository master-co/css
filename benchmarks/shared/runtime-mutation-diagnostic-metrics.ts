import type { BenchmarkMetric } from './types'

export const runtimeMutationDiagnosticMetrics = [
  {
    id: 'interaction-ready-ms',
    label: 'Mutation to ready',
    unit: 'ms',
    description: 'Elapsed time from cleanup-cycle start until the page completes the post-mutation animation-frame settle.'
  },
  {
    id: 'style-recalculation-ms',
    label: 'Style recalculation',
    unit: 'ms',
    description: 'Trace-derived style recalculation duration during cleanup cycles.'
  },
  {
    id: 'layout-ms',
    label: 'Layout',
    unit: 'ms',
    description: 'Trace-derived layout duration during cleanup cycles.'
  },
  {
    id: 'paint-ms',
    label: 'Paint',
    unit: 'ms',
    description: 'Trace-derived paint and pre-paint duration during cleanup cycles.'
  },
  {
    id: 'long-task-count',
    label: 'Long tasks',
    unit: 'count',
    description: 'Count of trace task events at or above 50 ms during cleanup cycles.'
  },
  {
    id: 'runtime-mutation-ms',
    label: 'Runtime ensure/delete total',
    unit: 'ms',
    description: 'Instrumented Master CSS runtime ensure/delete class-rules duration during cleanup cycles.'
  },
  {
    id: 'runtime-ensure-class-rules-duration-ms',
    label: 'Runtime ensure class rules duration',
    unit: 'ms',
    description: 'Instrumented duration spent inside CSSRuntime.ensureClassRules(...).'
  },
  {
    id: 'runtime-delete-class-rules-duration-ms',
    label: 'Runtime delete class rules duration',
    unit: 'ms',
    description: 'Instrumented duration spent inside CSSRuntime.deleteClassRules(...).'
  },
  {
    id: 'runtime-ensure-class-rules-call-count',
    label: 'Runtime ensure class rules calls',
    unit: 'count',
    description: 'Number of CSSRuntime.ensureClassRules(...) calls during cleanup cycles.'
  },
  {
    id: 'runtime-delete-class-rules-call-count',
    label: 'Runtime delete class rules calls',
    unit: 'count',
    description: 'Number of CSSRuntime.deleteClassRules(...) calls during cleanup cycles.'
  },
  {
    id: 'runtime-ensured-class-count',
    label: 'Runtime ensured classes',
    unit: 'count',
    description: 'Total entries in readonly class-name arrays passed to ensureClassRules during collection; repeated entries count separately and empty arrays add zero.'
  },
  {
    id: 'runtime-deleted-class-count',
    label: 'Runtime deleted classes',
    unit: 'count',
    description: 'Total entries in readonly class-name arrays passed to deleteClassRules during collection, including queued calls; this is a requested-entry count, not a successful-rule deletion count.'
  },
  {
    id: 'runtime-deferred-remove-call-count',
    label: 'Deferred remove calls',
    unit: 'count',
    description: 'Benchmark-only remove calls queued for an in-trace batched flush.'
  },
  {
    id: 'runtime-deferred-remove-class-count',
    label: 'Deferred removed classes',
    unit: 'count',
    description: 'Benchmark-only class arguments queued for an in-trace batched remove flush.'
  },
  {
    id: 'runtime-suppressed-remove-call-count',
    label: 'Suppressed remove calls',
    unit: 'count',
    description: 'Benchmark-only remove calls suppressed until after trace collection.'
  },
  {
    id: 'runtime-suppressed-remove-class-count',
    label: 'Suppressed removed classes',
    unit: 'count',
    description: 'Benchmark-only class arguments suppressed until after trace collection.'
  },
  {
    id: 'runtime-flush-remove-call-count',
    label: 'Flush remove calls',
    unit: 'count',
    description: 'Batched CSSRuntime.deleteClassRules(...) calls executed by the benchmark-only flush strategy.'
  },
  {
    id: 'runtime-flush-remove-class-count',
    label: 'Flush removed classes',
    unit: 'count',
    description: 'Unique class names per runtime passed as one array to the original deleteClassRules method by the benchmark-only flush strategy.'
  },
  {
    id: 'runtime-flush-remove-duration-ms',
    label: 'Flush remove duration',
    unit: 'ms',
    description: 'Duration spent executing the benchmark-only batched remove flush.'
  },
  {
    id: 'runtime-queued-remove-class-count',
    label: 'Queued remove classes',
    unit: 'count',
    description: 'Total class arguments queued by benchmark-only runtime removal strategies.'
  },
  {
    id: 'mutation-observer-callback-count',
    label: 'MutationObserver callbacks',
    unit: 'count',
    description: 'Number of MutationObserver callback deliveries observed during cleanup cycles.'
  },
  {
    id: 'mutation-record-count',
    label: 'Mutation records',
    unit: 'count',
    description: 'Total MutationRecord count delivered during cleanup cycles.'
  },
  {
    id: 'mutation-added-node-count',
    label: 'Mutation added nodes',
    unit: 'count',
    description: 'Total top-level added node count in delivered MutationRecords.'
  },
  {
    id: 'mutation-removed-node-count',
    label: 'Mutation removed nodes',
    unit: 'count',
    description: 'Total top-level removed node count in delivered MutationRecords.'
  },
  {
    id: 'mutation-class-attribute-count',
    label: 'Class attribute records',
    unit: 'count',
    description: 'MutationRecords for class attribute changes during cleanup cycles.'
  },
  {
    id: 'mutation-cycle-count',
    label: 'Mutation cycles',
    unit: 'count',
    description: 'Append/remove cleanup cycle count configured by the fixture.'
  },
  {
    id: 'append-count',
    label: 'Appends per cycle',
    unit: 'count',
    description: 'Repeated component append count per cleanup cycle.'
  },
  {
    id: 'post-interaction-settle-frame-count',
    label: 'Post-interaction settle frames',
    unit: 'count',
    description: 'Number of animation frames waited inside the traced interaction after the cleanup cycles.'
  },
  {
    id: 'preseeded-runtime-rule-count',
    label: 'Preseeded runtime rules',
    unit: 'count',
    description: 'Number of temporary cleanup rules added before trace collection for the preseed-temp-rules diagnostic axis.'
  },
  {
    id: 'removed-node-count',
    label: 'Removed fixture nodes',
    unit: 'count',
    description: 'Expected repeated component removals across all cleanup cycles.'
  },
  {
    id: 'affected-element-count',
    label: 'Affected elements',
    unit: 'count',
    description: 'Number of repeated components intentionally touched by the cleanup scenario.'
  },
  {
    id: 'dom-node-count',
    label: 'DOM nodes after cleanup',
    unit: 'count',
    description: 'Total DOM element count after cleanup settles.'
  },
  {
    id: 'runtime-class-count-before',
    label: 'Runtime class counts before',
    unit: 'count',
    description: 'Public snapshot usageCounts key count before the cleanup scenario.'
  },
  {
    id: 'runtime-class-count-after',
    label: 'Runtime class counts after',
    unit: 'count',
    description: 'Public snapshot usageCounts key count after the cleanup scenario.'
  },
  {
    id: 'runtime-utility-count-before',
    label: 'Runtime utility count before',
    unit: 'count',
    description: 'Public snapshot generated class-name count before the cleanup scenario.'
  },
  {
    id: 'runtime-utility-count-after',
    label: 'Runtime utility count after trace',
    unit: 'count',
    description: 'Public snapshot generated class-name count after trace collection and before the post-trace product cleanup flush wait.'
  },
  {
    id: 'temporary-class-count-before',
    label: 'Temporary class count before',
    unit: 'count',
    description: 'Tracked temporary cleanup class count before the scenario.'
  },
  {
    id: 'temporary-class-count-after',
    label: 'Temporary class count after trace',
    unit: 'count',
    description: 'Tracked temporary cleanup class count after trace collection and before the post-trace product cleanup flush wait.'
  },
  {
    id: 'runtime-class-count-after-flush',
    label: 'Runtime class counts after flush',
    unit: 'count',
    description: 'Public snapshot usageCounts key count after the post-trace product cleanup flush wait.'
  },
  {
    id: 'runtime-utility-count-after-flush',
    label: 'Runtime utility count after flush',
    unit: 'count',
    description: 'Public snapshot generated class-name count after the post-trace product cleanup flush wait.'
  },
  {
    id: 'retained-class-count-before',
    label: 'Retained classes before',
    unit: 'count',
    description: 'Public snapshot retained class count before the cleanup scenario.'
  },
  {
    id: 'retained-class-count-after',
    label: 'Retained classes after trace',
    unit: 'count',
    description: 'Public snapshot retained class count after trace collection.'
  },
  {
    id: 'retained-class-count-after-flush',
    label: 'Retained classes after flush',
    unit: 'count',
    description: 'Public snapshot retained class count after the product retained-rule settle window.'
  },
  {
    id: 'retained-class-count-after-forced-cleanup',
    label: 'Retained classes after forced cleanup',
    unit: 'count',
    description: 'Public snapshot retained class count after the out-of-trace forced public deletion of inactive retained rules.'
  },
  {
    id: 'retained-rule-count-after-flush',
    label: 'Retained rules after flush',
    unit: 'count',
    description: 'Estimated retained generated rule count after the product retained-rule settle window.'
  },
  {
    id: 'retained-raw-bytes-after-flush',
    label: 'Retained bytes after flush',
    unit: 'B',
    description: 'Estimated retained generated CSS raw bytes after the product retained-rule settle window.'
  },
  {
    id: 'retained-cleanup-removed-class-count',
    label: 'Forced retained cleanup classes',
    unit: 'count',
    description: 'Inactive retained class count explicitly removed through public deleteClassRules() outside trace collection.'
  },
  {
    id: 'retained-cleanup-duration-ms',
    label: 'Forced retained cleanup duration',
    unit: 'ms',
    description: 'Duration of the explicit public deleteClassRules() operation outside trace collection; excludes the product settle window.'
  },
  {
    id: 'temporary-class-count-after-flush',
    label: 'Temporary class count after flush',
    unit: 'count',
    description: 'Tracked temporary cleanup class count after the post-trace product cleanup flush wait.'
  },
  {
    id: 'runtime-generated-rule-count-delta',
    label: 'Runtime rule delta',
    unit: 'count',
    description: 'Change in public snapshot output rule entries across layers (including keyframes blocks) after cleanup.'
  },
  {
    id: 'runtime-style-raw-bytes-delta',
    label: 'Runtime style byte delta',
    unit: 'B',
    description: 'Change in UTF-8 bytes for public snapshot cssText after cleanup.'
  },
  {
    id: 'computed-style-valid',
    label: 'Computed style valid',
    unit: 'count',
    description: '1 when the scenario assertion passes; cleanup checks alignment and temporary width during every cycle. These reads are included in measured work.'
  },
  {
    id: 'cleanup-valid',
    label: 'Cleanup valid',
    unit: 'count',
    description: '1 when temporary DOM nodes are removed and temporary classes are absent from public snapshot usageCounts after the product cleanup wait.'
  },
  {
    id: 'cleanup-valid-during-trace',
    label: 'Cleanup valid during trace',
    unit: 'count',
    description: '1 when temporary DOM nodes are removed and temporary classes are absent from public snapshot usageCounts before trace collection ended.'
  },
  {
    id: 'cleanup-valid-after-flush',
    label: 'Cleanup valid after flush',
    unit: 'count',
    description: '1 when temporary DOM nodes are removed and temporary classes are absent from public snapshot usageCounts after the product cleanup wait.'
  },
  {
    id: 'progressive-adopted',
    label: 'Progressive adopted',
    unit: 'count',
    description: '1 when progressive mode adopted server-rendered style#master-css before interaction.'
  }
] satisfies BenchmarkMetric[]
