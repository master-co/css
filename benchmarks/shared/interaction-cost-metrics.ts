import type { BenchmarkMetric } from './types'

export const interactionCostMetrics = [
  {
    id: 'interaction-ready-ms',
    label: 'Mutation to ready',
    unit: 'ms',
    description: 'Elapsed time from the interaction mutation start until the page completes the post-mutation animation-frame settle.'
  },
  {
    id: 'runtime-mutation-ms',
    label: 'Runtime rule update',
    unit: 'ms',
    description: 'Instrumented Master CSS runtime ensure/delete class-rules time during the measured interaction, where a runtime exists.'
  },
  {
    id: 'runtime-generated-rule-count-delta',
    label: 'Runtime rule delta',
    unit: 'count',
    description: 'Change in public snapshot output rule entries across layers (including keyframes blocks) after the interaction.'
  },
  {
    id: 'runtime-style-raw-bytes-delta',
    label: 'Runtime style byte delta',
    unit: 'B',
    description: 'Change in UTF-8 bytes for public snapshot cssText after the interaction.'
  },
  {
    id: 'style-recalculation-ms',
    label: 'Style recalculation',
    unit: 'ms',
    description: 'Trace-derived style recalculation duration during the interaction.'
  },
  {
    id: 'layout-ms',
    label: 'Layout',
    unit: 'ms',
    description: 'Trace-derived layout duration during the interaction.'
  },
  {
    id: 'paint-ms',
    label: 'Paint',
    unit: 'ms',
    description: 'Trace-derived paint and pre-paint duration during the interaction.'
  },
  {
    id: 'long-task-count',
    label: 'Long tasks',
    unit: 'count',
    description: 'Count of trace task events at or above 50 ms during the interaction.'
  },
  {
    id: 'dom-node-count',
    label: 'DOM nodes',
    unit: 'count',
    description: 'Total DOM element count after the interaction settles.'
  },
  {
    id: 'affected-element-count',
    label: 'Affected elements',
    unit: 'count',
    description: 'Number of fixture elements intentionally touched by the scenario.'
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
    description: '1 when temporary DOM nodes are removed and temporary classes are absent from public snapshot usageCounts after scenarios that remove nodes.'
  },
  {
    id: 'progressive-adopted',
    label: 'Progressive adopted',
    unit: 'count',
    description: '1 when the Master progressive variant adopted server-rendered style#master-css before interaction.'
  }
] satisfies BenchmarkMetric[]
