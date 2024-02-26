import type Core from '../core'

declare global {
    // eslint-disable-next-line no-var
    var masterCSSs: Core[]
    // eslint-disable-next-line no-var
    var MasterCSS: typeof Core
}