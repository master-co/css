import {
  createToolingBinding,
  type MasterCSSWasmBindingLoadOptions
} from '@master/css-binding/tooling'
import {
  bindSourceExtractor,
  type SourceExtractor
} from './session'

export type BrowserSourceExtractor = SourceExtractor & { readonly binding: 'wasm' }

export async function createSourceExtractor(
  options: MasterCSSWasmBindingLoadOptions = {}
): Promise<BrowserSourceExtractor> {
  const tooling = await createToolingBinding({ binding: 'wasm', wasm: options })
  return bindSourceExtractor(
    tooling.binding,
    await tooling.createSourceSession()
  ) as BrowserSourceExtractor
}

export type { MasterCSSWasmBindingLoadOptions }
