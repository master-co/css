import type { BenchmarkMetric } from './types'

export const masterDeliveryModeMetrics = [
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
    description: 'Raw bytes for externally linked CSS delivered before runtime work.'
  },
  {
    id: 'external-css-gzip-bytes',
    label: 'External CSS gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for externally linked CSS delivered before runtime work.'
  },
  {
    id: 'external-css-brotli-bytes',
    label: 'External CSS brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for externally linked CSS delivered before runtime work.'
  },
  {
    id: 'inline-css-raw-bytes',
    label: 'Inline CSS raw bytes',
    unit: 'B',
    description: 'Raw bytes for inline style#master-css delivered in the HTML.'
  },
  {
    id: 'inline-css-gzip-bytes',
    label: 'Inline CSS gzip bytes',
    unit: 'B',
    description: 'Gzip bytes for inline style#master-css delivered in the HTML.'
  },
  {
    id: 'inline-css-brotli-bytes',
    label: 'Inline CSS brotli bytes',
    unit: 'B',
    description: 'Brotli bytes for inline style#master-css delivered in the HTML.'
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
    description: 'Elapsed wall time from navigation start until the page loaded, passed correctness checks, and the runtime observed the DOM when applicable.'
  },
  {
    id: 'stylesheet-parse-ms',
    label: 'Stylesheet parse/attach',
    unit: 'ms',
    description: 'Trace-derived stylesheet parsing and attachment duration where Chromium exposes stable timeline events.'
  },
  {
    id: 'style-recalculation-ms',
    label: 'Style recalculation',
    unit: 'ms',
    description: 'Trace-derived style recalculation duration from Chromium timeline events.'
  },
  {
    id: 'layout-ms',
    label: 'Layout',
    unit: 'ms',
    description: 'Trace-derived layout duration from Chromium timeline events.'
  },
  {
    id: 'paint-ms',
    label: 'Paint',
    unit: 'ms',
    description: 'Trace-derived paint and pre-paint duration from Chromium timeline events.'
  },
  {
    id: 'long-task-count',
    label: 'Long tasks',
    unit: 'count',
    description: 'Count of trace task events at or above 50 ms.'
  },
  {
    id: 'request-count',
    label: 'Request count',
    unit: 'count',
    description: 'Initial HTML request plus same-origin resource requests observed by the page.'
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
    description: 'Time from browser runtime script execution to runtime observe/hydration completion.'
  },
  {
    id: 'manifest-load-ms',
    label: 'Manifest load',
    unit: 'ms',
    description: 'Resource timing duration for the default manifest JSON fetch.'
  },
  {
    id: 'runtime-observe-ms',
    label: 'Runtime observe/hydrate',
    unit: 'ms',
    description: 'Synchronous duration of CSSRuntime.observe(), including progressive hydration when applicable.'
  },
  {
    id: 'progressive-adopted',
    label: 'Progressive adopted',
    unit: 'count',
    description: '1 when runtime successfully adopted the pre-rendered style#master-css, otherwise 0.'
  },
  {
    id: 'runtime-generated-rule-count',
    label: 'Runtime generated rules',
    unit: 'count',
    description: 'CSSOM rule count in style#master-css after runtime observe/hydration.'
  },
  {
    id: 'runtime-style-raw-bytes',
    label: 'Runtime style raw bytes',
    unit: 'B',
    description: 'Raw bytes of style#master-css after runtime observe/hydration.'
  }
] satisfies BenchmarkMetric[]
