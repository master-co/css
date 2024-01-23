/* eslint-disable no-var */
import type { Config } from '@master/css'
import type { CSSRuntime as _CSSRuntime } from '../core'

declare global {
    var CSSRuntime: typeof _CSSRuntime
    var runtimeCSSs: _CSSRuntime[]
    var runtimeCSS: _CSSRuntime
    var masterCSSConfig: Config
}