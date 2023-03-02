import type { MasterCSS } from '@master/css'
import { createContext, useContext } from 'react'

export const CSSContext = createContext<MasterCSS>(null)

export function useCSS() {
    return useContext(CSSContext)
}