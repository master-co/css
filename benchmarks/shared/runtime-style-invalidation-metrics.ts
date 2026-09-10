import type { BenchmarkMetric } from './types'

export const runtimeStyleInvalidationMetrics = [
  {
    id: 'interaction-ready-ms',
    label: 'Mutation to ready',
    unit: 'ms',
    description: 'Elapsed time from diagnostic action start until the page completes its configured animation-frame settle.'
  },
  {
    id: 'style-recalculation-ms',
    label: 'Style recalculation',
    unit: 'ms',
    description: 'Trace-derived style recalculation duration.'
  },
  {
    id: 'layout-ms',
    label: 'Layout',
    unit: 'ms',
    description: 'Trace-derived layout duration.'
  },
  {
    id: 'paint-ms',
    label: 'Paint',
    unit: 'ms',
    description: 'Trace-derived paint and pre-paint duration.'
  },
  {
    id: 'long-task-count',
    label: 'Long tasks',
    unit: 'count',
    description: 'Count of trace task events at or above 50 ms.'
  },
  {
    id: 'runtime-mutation-ms',
    label: 'Runtime ensure/delete total',
    unit: 'ms',
    description: 'Instrumented Master CSS runtime ensure/delete class-rules duration during the diagnostic action.'
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
    id: 'mutation-observer-callback-count',
    label: 'MutationObserver callbacks',
    unit: 'count',
    description: 'Number of MutationObserver callback deliveries during the trace.'
  },
  {
    id: 'mutation-observer-callback-duration-ms',
    label: 'MutationObserver callback duration',
    unit: 'ms',
    description: 'Instrumented duration spent inside delivered MutationObserver callbacks.'
  },
  {
    id: 'mutation-record-count',
    label: 'Mutation records',
    unit: 'count',
    description: 'Total MutationRecord count delivered during the trace.'
  },
  {
    id: 'runtime-generated-rule-count-delta',
    label: 'Runtime rule delta',
    unit: 'count',
    description: 'Change in public snapshot output rule entries across layers (including keyframes blocks) after the diagnostic action.'
  },
  {
    id: 'preseeded-runtime-rule-count',
    label: 'Preseeded runtime rules',
    unit: 'count',
    description: 'Number of temporary cleanup rules generated before trace collection.'
  },
  {
    id: 'seeded-retained-class-count',
    label: 'Seeded retained classes',
    unit: 'count',
    description: 'Number of benchmark-only inactive retained classes seeded before trace collection.'
  },
  {
    id: 'seeded-retained-rule-count',
    label: 'Seeded retained rules',
    unit: 'count',
    description: 'Estimated generated rule count for benchmark-only inactive retained classes.'
  },
  {
    id: 'seeded-retained-raw-bytes',
    label: 'Seeded retained bytes',
    unit: 'B',
    description: 'Estimated raw CSS bytes for benchmark-only inactive retained classes.'
  },
  {
    id: 'retained-set-add-count',
    label: 'Retained set adds',
    unit: 'count',
    description: 'Benchmark-instrumented retainedClassNames.add(...) calls during trace collection.'
  },
  {
    id: 'retained-set-delete-count',
    label: 'Retained set deletes',
    unit: 'count',
    description: 'Benchmark-instrumented retainedClassNames.delete(...) calls during trace collection.'
  },
  {
    id: 'retained-set-clear-count',
    label: 'Retained set clears',
    unit: 'count',
    description: 'Benchmark-instrumented retainedClassNames.clear() calls during trace collection.'
  },
  {
    id: 'observer-paused',
    label: 'Observer paused',
    unit: 'count',
    description: '1 when the runtime MutationObserver was disconnected before trace collection.'
  },
  {
    id: 'runtime-style-rule-count-before',
    label: 'Runtime stylesheet rules before',
    unit: 'count',
    description: 'Runtime-generated stylesheet rule count before trace collection.'
  },
  {
    id: 'runtime-style-rule-count-after',
    label: 'Runtime stylesheet rules after trace',
    unit: 'count',
    description: 'Runtime-generated stylesheet rule count after trace collection.'
  },
  {
    id: 'runtime-style-rule-count-after-flush',
    label: 'Runtime stylesheet rules after flush',
    unit: 'count',
    description: 'Runtime-generated stylesheet rule count after the post-trace product settle window.'
  },
  {
    id: 'runtime-utility-count-before',
    label: 'Runtime utility count before',
    unit: 'count',
    description: 'Public snapshot generated class-name count before trace collection.'
  },
  {
    id: 'runtime-utility-count-after',
    label: 'Runtime utility count after trace',
    unit: 'count',
    description: 'Public snapshot generated class-name count after trace collection.'
  },
  {
    id: 'runtime-utility-count-after-flush',
    label: 'Runtime utility count after flush',
    unit: 'count',
    description: 'Public snapshot generated class-name count after the post-trace product settle window.'
  },
  {
    id: 'retained-class-count-before',
    label: 'Retained classes before',
    unit: 'count',
    description: 'Public snapshot retained class count before trace collection.'
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
    description: 'Public snapshot retained class count after the post-trace product settle window.'
  },
  {
    id: 'retained-rule-count-after-flush',
    label: 'Retained rules after flush',
    unit: 'count',
    description: 'Estimated retained generated rule count after the post-trace product settle window.'
  },
  {
    id: 'retained-raw-bytes-after-flush',
    label: 'Retained bytes after flush',
    unit: 'B',
    description: 'Estimated retained generated CSS raw bytes after the post-trace product settle window.'
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
    id: 'computed-style-valid',
    label: 'Computed style valid',
    unit: 'count',
    description: '1 when every cleanup cycle passes alignment and temporary-width checks, or the idle alignment probe passes. Correctness reads are part of measured work.'
  },
  {
    id: 'cleanup-valid',
    label: 'Cleanup valid',
    unit: 'count',
    description: '1 when temporary DOM nodes are removed and temporary classes are absent from public snapshot usageCounts after product settle.'
  },
  {
    id: 'progressive-adopted',
    label: 'Progressive adopted',
    unit: 'count',
    description: '1 when progressive mode adopted server-rendered style#master-css before interaction.'
  }
] satisfies BenchmarkMetric[]
