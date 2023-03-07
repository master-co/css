import type { MasterCSS } from '@master/css'
import { Context, createContext, useContext } from 'react'

export const CSSContext: Context<MasterCSS> = createContext<MasterCSS>(null)

// export function createCSSContext(css?: MasterCSS) {
//     return CSSContext = createContext<MasterCSS>(css)
// }

// export function getCSSContext() {
//     return CSSContext
// }

export function useCSS() {
    return useContext(CSSContext)
}
