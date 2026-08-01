import type { BenchmarkMetric } from './types'

export const browserLifecycleMetrics = [
  {
    id: 'html-raw-bytes',
    label: 'HTML raw bytes',
    unit: 'B',
    description: 'Raw bytes for the benchmark page HTML.'
  },
  {
    id: 'html-gzip-bytes',
    label: 'HTML gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for the benchmark page HTML.'
  },
  {
    id: 'html-brotli-bytes',
    label: 'HTML brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for the benchmark page HTML.'
  },
  {
    id: 'external-css-raw-bytes',
    label: 'External CSS raw bytes',
    unit: 'B',
    description: 'Raw bytes for externally linked CSS.'
  },
  {
    id: 'external-css-gzip-bytes',
    label: 'External CSS gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for externally linked CSS.'
  },
  {
    id: 'external-css-brotli-bytes',
    label: 'External CSS brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for externally linked CSS.'
  },
  {
    id: 'inline-css-raw-bytes',
    label: 'Inline CSS raw bytes',
    unit: 'B',
    description: 'Raw bytes for inline style#master-css.'
  },
  {
    id: 'inline-css-gzip-bytes',
    label: 'Inline CSS gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for inline style#master-css.'
  },
  {
    id: 'inline-css-brotli-bytes',
    label: 'Inline CSS brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for inline style#master-css.'
  },
  {
    id: 'runtime-js-raw-bytes',
    label: 'Runtime JS raw bytes',
    unit: 'B',
    description: 'Raw bytes for the Master CSS browser runtime bundle.'
  },
  {
    id: 'runtime-js-gzip-bytes',
    label: 'Runtime JS gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for the Master CSS browser runtime bundle.'
  },
  {
    id: 'runtime-js-brotli-bytes',
    label: 'Runtime JS brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for the Master CSS browser runtime bundle.'
  },
  {
    id: 'manifest-json-raw-bytes',
    label: 'Manifest JSON raw bytes',
    unit: 'B',
    description: 'Raw bytes for the runtime default manifest JSON payload.'
  },
  {
    id: 'manifest-json-gzip-bytes',
    label: 'Manifest JSON gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for the runtime default manifest JSON payload.'
  },
  {
    id: 'manifest-json-brotli-bytes',
    label: 'Manifest JSON brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for the runtime default manifest JSON payload.'
  },
  {
    id: 'hydration-manifest-raw-bytes',
    label: 'Hydration manifest raw bytes',
    unit: 'B',
    description: 'Raw bytes for inline progressive hydration manifest JSON.'
  },
  {
    id: 'hydration-manifest-gzip-bytes',
    label: 'Hydration manifest gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for inline progressive hydration manifest JSON.'
  },
  {
    id: 'hydration-manifest-brotli-bytes',
    label: 'Hydration manifest brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for inline progressive hydration manifest JSON.'
  },
  {
    id: 'delivered-style-rule-count',
    label: 'Delivered style rules',
    unit: 'count',
    description: 'Style rule count for CSS delivered before runtime-generated rules.'
  },
  {
    id: 'delivered-selector-count',
    label: 'Delivered selectors',
    unit: 'count',
    description: 'Selector count for CSS delivered before runtime-generated rules.'
  },
  {
    id: 'delivered-declaration-count',
    label: 'Delivered declarations',
    unit: 'count',
    description: 'Declaration count for CSS delivered before runtime-generated rules.'
  },
  {
    id: 'navigation-ready-ms',
    label: 'Navigation to ready',
    unit: 'ms',
    description: 'Elapsed wall time from navigation or interaction start until the page reaches the benchmark ready marker.'
  },
  {
    id: 'stylesheet-parse-ms',
    label: 'Stylesheet parse/attach',
    unit: 'ms',
    description: 'Trace-derived stylesheet parsing and attachment duration where Chromium exposes stable events.'
  },
  {
    id: 'style-recalculation-ms',
    label: 'Style recalculation',
    unit: 'ms',
    description: 'Trace-derived style recalculation duration from Chromium timeline events.'
  },
  {
    id: 'style-recalculation-count',
    label: 'Style recalculation count',
    unit: 'count',
    description: 'Count of trace events treated as style recalculation.'
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
    id: 'fcp-ms',
    label: 'FCP',
    unit: 'ms',
    description: 'Local fixture first-contentful-paint from the browser Performance API.'
  },
  {
    id: 'lcp-ms',
    label: 'LCP candidate',
    unit: 'ms',
    description: 'Local fixture largest-contentful-paint candidate captured by PerformanceObserver.'
  },
  {
    id: 'inp-style-interaction-ms',
    label: 'INP-style interaction latency',
    unit: 'ms',
    description: 'Local fixture interaction-to-settle latency. This is not a real Web Vitals INP value.'
  },
  {
    id: 'js-heap-used-bytes',
    label: 'JS heap used',
    unit: 'B',
    description: 'Chromium Runtime.getHeapUsage usedSize where available.'
  },
  {
    id: 'dom-node-count',
    label: 'DOM nodes',
    unit: 'count',
    description: 'Total DOM element count after the measured scenario.'
  },
  {
    id: 'affected-element-count',
    label: 'Affected elements',
    unit: 'count',
    description: 'Number of elements intentionally touched by the measured scenario.'
  },
  {
    id: 'average-class-count',
    label: 'Average class count',
    unit: 'count',
    description: 'Average classList length across DOM elements after the measured scenario.'
  },
  {
    id: 'cssom-rule-count',
    label: 'CSSOM rules',
    unit: 'count',
    description: 'Recursive CSSOM rule count across accessible stylesheets after the measured scenario.'
  },
  {
    id: 'runtime-ready-ms',
    label: 'Runtime ready',
    unit: 'ms',
    description: 'Browser performance timestamp when Master CSS runtime finished observe/hydration.'
  },
  {
    id: 'runtime-bootstrap-ms',
    label: 'Runtime bootstrap',
    unit: 'ms',
    description: 'Time from runtime script execution to runtime observe/hydration completion.'
  },
  {
    id: 'runtime-observe-ms',
    label: 'Runtime observe/hydrate',
    unit: 'ms',
    description: 'Synchronous duration of CSSRuntime.observe(), including progressive hydration when applicable.'
  },
  {
    id: 'runtime-mutation-ms',
    label: 'Runtime mutation work',
    unit: 'ms',
    description: 'Instrumented Master CSS runtime ensure/delete class-rules duration during the measured scenario.'
  },
  {
    id: 'runtime-generated-rule-count',
    label: 'Runtime generated rules',
    unit: 'count',
    description: 'Runtime class utility count or recursive style#master-css rule count after the measured scenario.'
  },
  {
    id: 'runtime-generated-rule-count-delta',
    label: 'Runtime generated rule delta',
    unit: 'count',
    description: 'Change in runtime generated rule count during the measured scenario.'
  },
  {
    id: 'runtime-style-raw-bytes',
    label: 'Runtime style raw bytes',
    unit: 'B',
    description: 'Raw bytes of style#master-css after the measured scenario.'
  },
  {
    id: 'runtime-style-raw-bytes-delta',
    label: 'Runtime style byte delta',
    unit: 'B',
    description: 'Change in raw style#master-css bytes during the measured scenario.'
  },
  {
    id: 'retained-class-count',
    label: 'Retained classes',
    unit: 'count',
    description: 'Runtime retainedClassNames count after the measured scenario.'
  },
  {
    id: 'retained-rule-count',
    label: 'Retained rules',
    unit: 'count',
    description: 'Estimated retained generated rule count after the measured scenario.'
  },
  {
    id: 'mutation-observer-callback-count',
    label: 'MutationObserver callbacks',
    unit: 'count',
    description: 'Number of MutationObserver callback deliveries during the measured scenario.'
  },
  {
    id: 'mutation-observer-callback-duration-ms',
    label: 'MutationObserver callback duration',
    unit: 'ms',
    description: 'Instrumented duration spent inside delivered MutationObserver callbacks.'
  },
  {
    id: 'route-count',
    label: 'Routes',
    unit: 'count',
    description: 'Number of route states visited by the scenario.'
  },
  {
    id: 'progressive-adopted',
    label: 'Progressive adopted',
    unit: 'count',
    description: '1 when the Master progressive variant adopted server-rendered CSS before the scenario.'
  },
  {
    id: 'computed-style-valid',
    label: 'Computed style valid',
    unit: 'count',
    description: '1 when the scenario computed-style assertion passed, otherwise 0.'
  }
] satisfies BenchmarkMetric[]

