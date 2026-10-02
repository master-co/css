export const MASTER_CSS_RUNTIME_STYLE_ID = 'master-css'

export const MASTER_CSS_STYLESHEET_ASSET_SUFFIX = '.master-css.json'

/** Final, host-processed CSS with Rust-issued URL placeholders. */
export interface MasterCSSRuntimeStylesheetAsset {
  readonly version: 1
  readonly css: string
  readonly urls: readonly {
    readonly placeholder: string
    readonly url: string
    readonly stylesheet: boolean
  }[]
}
