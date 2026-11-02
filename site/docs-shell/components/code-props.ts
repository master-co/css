import type { MasterCSSShikiOptions } from '@master/css-language-service/shiki'

export declare interface CodeProp {
  name?: string
  lang: string
  ext?: string
  beautify?: boolean
  dedent?: boolean | 'block'
  type?: string
  number?: boolean
  preClassName?: string
  masterCSS?: MasterCSSShikiOptions
  tabbarClassName?: string
  /** Accepted for older callers; the bar names the file and nothing else. */
  showControls?: boolean
  copyable?: boolean
  class?: string
}

export declare interface CodeTab {
  name?: string
  lang: string
  ext?: string
  beautify?: boolean
  dedent?: boolean | 'block'
  type?: string
  number?: boolean
  showControls?: boolean
  code: string
}
