import {
  createToolingBackend,
  type MasterCSSWasmBackendLoadOptions
} from '@master/css-backend/tooling'
import {
  bindSourceExtractor,
  type SourceExtractor
} from './session'

export type BrowserSourceExtractor = SourceExtractor & { readonly backend: 'wasm' }

export async function createSourceExtractor(
  options: MasterCSSWasmBackendLoadOptions = {}
): Promise<BrowserSourceExtractor> {
  const tooling = await createToolingBackend({ backend: 'wasm', wasm: options })
  return bindSourceExtractor(
    tooling.backend,
    await tooling.createSourceSession()
  ) as BrowserSourceExtractor
}

export type { MasterCSSWasmBackendLoadOptions }
