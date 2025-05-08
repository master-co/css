'use client'

import { CSSRuntime, initCSSRuntime } from '@master/css-runtime'
import { createContext, useContext, useRef, useCallback, ReactNode } from 'react'
import type CSSRuntimeProviderProps from './types/provider-props'
// fix: ReferenceError: React is not defined
import React from 'react'
import useIsomorphicLayoutEffect from './uses/useIsomorphicLayoutEffect'
import { useUpdateEffect } from './uses/useUpdateEffect'

export const CSSRuntimeContext = createContext<CSSRuntime | undefined>(undefined)
export const useCSSRuntime = () => useContext(CSSRuntimeContext)

export default function CSSRuntimeProvider(props: CSSRuntimeProviderProps) {
    const cssRuntime = useRef<CSSRuntime>(undefined)

    /** onMounted */
    useIsomorphicLayoutEffect(() => {
        cssRuntime.current = initCSSRuntime(props.config, props.root ?? document)
        return () => {
            cssRuntime.current?.destroy()
            cssRuntime.current = undefined
        }
    }, [])

    /** on config change */
    useUpdateEffect(() => {
        if (cssRuntime.current) {
            cssRuntime.current.refresh(props.config)
        }
    }, [props.config])

    /** on root change */
    useUpdateEffect(() => {
        if (cssRuntime.current) {
            cssRuntime.current.destroy()
            cssRuntime.current = undefined
            cssRuntime.current = initCSSRuntime(props.config, props.root ?? document)
        }
    }, [props.root])

    return <CSSRuntimeContext.Provider value={cssRuntime.current}>{props.children}</CSSRuntimeContext.Provider>
}