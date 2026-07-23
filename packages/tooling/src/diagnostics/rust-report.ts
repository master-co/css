import { loadNativeBinding } from '@master/css-native'

export type RustInspectionReportCreator = <T>(input: unknown) => T | Promise<T>

export async function loadRustInspectionReportCreator(): Promise<RustInspectionReportCreator> {
  const loaded = loadNativeBinding()
  if (loaded) {
    return <T>(input: unknown) => JSON.parse(
      loaded.binding.createInspectionReportJson(JSON.stringify(input))
    ) as T
  }

  const [{ createToolingInspectionReport }, { readFile }] = await Promise.all([
    import('@master/css-wasm-tooling'),
    import('node:fs/promises')
  ])
  const wasmBytes = await readFile(new URL(import.meta.resolve('@master/css-wasm-tooling/wasm')))
  return async <T>(input: unknown) => await createToolingInspectionReport(input, {
    input: new Uint8Array(wasmBytes)
  }) as T
}
