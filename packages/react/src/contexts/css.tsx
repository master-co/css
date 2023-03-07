import type { MasterCSS } from '@master/css'
import { Context, createContext, useContext } from 'react'

export const CSSContext: Context<MasterCSS> = createContext<MasterCSS>(null)

export function useCSS() {
    return useContext(CSSContext)
}
