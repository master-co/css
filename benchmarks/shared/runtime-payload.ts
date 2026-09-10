import { readFile } from 'node:fs/promises'
import { summarizeBytes } from './bytes'
import { resolveBenchmarkPackageFile } from './runner'
import type { BenchmarkMetric, BenchmarkSample } from './types'

// The browser runtime resolves this sidecar relative to its script URL.
export const runtimeWasmFile = 'artifacts/mastercss_binding_wasm_engine_bg.wasm'

export function readRuntimeWasm() {
  return readFile(resolveBenchmarkPackageFile('@master/css-runtime', runtimeWasmFile))
}

export const runtimeWasmMetrics: BenchmarkMetric[] = ['raw', 'gzip', 'brotli'].map((encoding) => ({
  id: `runtime-wasm-${encoding}-bytes`,
  label: `Runtime Wasm ${encoding} bytes`,
  unit: 'B',
  description: `${encoding} bytes for the browser runtime Wasm sidecar; zero when no runtime is delivered. Compression sizes are estimates, not HTTP transfer measurements.`
}))

export function createRuntimeWasmSamples(variantId: string, wasm: Buffer): BenchmarkSample[] {
  const bytes = wasm.length ? summarizeBytes(wasm) : { rawBytes: 0, gzipBytes: 0, brotliBytes: 0 }
  return (['raw', 'gzip', 'brotli'] as const).map((encoding) => ({
    metricId: `runtime-wasm-${encoding}-bytes`,
    variantId,
    round: 0,
    value: bytes[`${encoding}Bytes`]
  }))
}
