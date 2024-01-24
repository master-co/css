/* eslint-disable no-var */
import type { Config } from '@master/css'
import type { RuntimeCSS as _CSSRuntime } from '../core'

declare global {
    var RuntimeCSS: typeof _CSSRuntime
    var runtimeCSSs: _CSSRuntime[]
    var runtimeCSS: _CSSRuntime
    var runtimeCSSConfig: Config
}