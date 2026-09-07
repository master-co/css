import { summarizeBytes } from './bytes'
import { analyzeCSSStructure } from './css-structure'
import type { BenchmarkSample } from './types'
import type { DeliveryModeDiagnostics } from './delivery-modes'

export function createPayloadSamples(variantId: string, payload: {
  html: Buffer
  externalCSS: Buffer
  inlineCSS: Buffer
  runtimeJS: Buffer
  manifestJSON: Buffer
  hydrationManifestJSON: Buffer
}): BenchmarkSample[] {
  return [
    ...createByteSamples(variantId, 'html', payload.html),
    ...createByteSamples(variantId, 'external-css', payload.externalCSS),
    ...createByteSamples(variantId, 'inline-css', payload.inlineCSS),
    ...createByteSamples(variantId, 'runtime-js', payload.runtimeJS),
    ...createByteSamples(variantId, 'manifest-json', payload.manifestJSON),
    ...createByteSamples(variantId, 'hydration-manifest', payload.hydrationManifestJSON)
  ]
}

function createByteSamples(variantId: string, prefix: string, buffer: Buffer): BenchmarkSample[] {
  const bytes = summarizeBytes(buffer)
  return [
    {
      metricId: `${prefix}-raw-bytes`,
      variantId,
      round: 0,
      value: bytes.rawBytes
    },
    {
      metricId: `${prefix}-gzip-bytes`,
      variantId,
      round: 0,
      value: bytes.gzipBytes
    },
    {
      metricId: `${prefix}-brotli-bytes`,
      variantId,
      round: 0,
      value: bytes.brotliBytes
    }
  ]
}

export function createDeliveredCSSStructureSamples(variantId: string, css: string): BenchmarkSample[] {
  const structure = css.trim()
    ? analyzeCSSStructure(css)
    : {
      styleRuleCount: 0,
      selectorCount: 0,
      declarationCount: 0
    }

  return [
    {
      metricId: 'delivered-style-rule-count',
      variantId,
      round: 0,
      value: structure.styleRuleCount
    },
    {
      metricId: 'delivered-selector-count',
      variantId,
      round: 0,
      value: structure.selectorCount
    },
    {
      metricId: 'delivered-declaration-count',
      variantId,
      round: 0,
      value: structure.declarationCount
    }
  ]
}

export function createBrowserSamples(variantId: string, round: number, metrics: {
  navigationReadyMs: number
  stylesheetParseMs: number
  styleRecalculationMs: number
  layoutMs: number
  paintMs: number
  longTaskCount: number
  requestCount: number
  runtimeReadyMs: number
  runtimeBootstrapMs: number
  manifestLoadMs: number
  runtimeObserveMs: number
  progressiveAdopted: number
  runtimeGeneratedRuleCount: number
  runtimeStyleRawBytes: number
}): BenchmarkSample[] {
  return [
    {
      metricId: 'navigation-ready-ms',
      variantId,
      round,
      value: metrics.navigationReadyMs
    },
    {
      metricId: 'stylesheet-parse-ms',
      variantId,
      round,
      value: metrics.stylesheetParseMs
    },
    {
      metricId: 'style-recalculation-ms',
      variantId,
      round,
      value: metrics.styleRecalculationMs
    },
    {
      metricId: 'layout-ms',
      variantId,
      round,
      value: metrics.layoutMs
    },
    {
      metricId: 'paint-ms',
      variantId,
      round,
      value: metrics.paintMs
    },
    {
      metricId: 'long-task-count',
      variantId,
      round,
      value: metrics.longTaskCount
    },
    {
      metricId: 'request-count',
      variantId,
      round,
      value: metrics.requestCount
    },
    {
      metricId: 'runtime-ready-ms',
      variantId,
      round,
      value: metrics.runtimeReadyMs
    },
    {
      metricId: 'runtime-bootstrap-ms',
      variantId,
      round,
      value: metrics.runtimeBootstrapMs
    },
    {
      metricId: 'manifest-load-ms',
      variantId,
      round,
      value: metrics.manifestLoadMs
    },
    {
      metricId: 'runtime-observe-ms',
      variantId,
      round,
      value: metrics.runtimeObserveMs
    },
    {
      metricId: 'progressive-adopted',
      variantId,
      round,
      value: metrics.progressiveAdopted
    },
    {
      metricId: 'runtime-generated-rule-count',
      variantId,
      round,
      value: metrics.runtimeGeneratedRuleCount
    },
    {
      metricId: 'runtime-style-raw-bytes',
      variantId,
      round,
      value: metrics.runtimeStyleRawBytes
    }
  ]
}

export function createProgressiveHydrationDiagnosticSamples(variantId: string, round: number, metrics: DeliveryModeDiagnostics): BenchmarkSample[] {
  return [
    {
      metricId: 'progressive-adopted',
      variantId,
      round,
      value: metrics.progressive ? 1 : 0
    },
    {
      metricId: 'hydration-manifest-rule-count',
      variantId,
      round,
      value: metrics.hydrationManifestRuleCount
    },
    {
      metricId: 'cssom-top-level-rule-count',
      variantId,
      round,
      value: metrics.cssomTopLevelRuleCount
    },
    {
      metricId: 'cssom-layer-rule-count',
      variantId,
      round,
      value: metrics.cssomLayerRuleCount
    },
    {
      metricId: 'runtime-generated-rule-count',
      variantId,
      round,
      value: metrics.runtimeGeneratedRuleCount
    },
    {
      metricId: 'runtime-style-raw-bytes',
      variantId,
      round,
      value: metrics.runtimeStyleRawBytes
    },
    {
      metricId: 'connected-class-count',
      variantId,
      round,
      value: metrics.connectedClassCount
    },
    {
      metricId: 'missing-hydrated-class-count',
      variantId,
      round,
      value: metrics.missingHydratedClassCount
    }
  ]
}
