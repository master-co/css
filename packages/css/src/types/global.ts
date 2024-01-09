/* eslint-disable no-var */
import type { MasterCSS as _MasterCSS } from '../core'

declare global {
    var MasterCSS: typeof _MasterCSS
    var masterCSSs: _MasterCSS[]
}