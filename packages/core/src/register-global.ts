import type Core from './core'

declare global {
    var MasterCSS: typeof Core
}

export default function registerGlobal(MasterCSS: typeof Core) {
    if (!globalThis.MasterCSS) globalThis.MasterCSS = MasterCSS
}