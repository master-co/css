/* eslint-disable no-var */
import type { Config } from '../config'
import type { RuntimeCSS as _RuntimeCSS } from '../runtime'
import type { MasterCSS as _MasterCSS } from '../core'

declare global {
    var MasterCSS: typeof _MasterCSS
    var masterCSSs: _MasterCSS[]
    var RuntimeCSS: typeof _RuntimeCSS
    var runtimeCSSs: _RuntimeCSS[]
    var runtimeCSS: _RuntimeCSS
    var masterCSSConfig: Config
}