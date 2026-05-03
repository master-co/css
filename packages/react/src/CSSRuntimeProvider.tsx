'use client'

import { CSSRuntime, initCSSRuntime } from '@master/css-runtime'
import { createContext, useContext, useRef, useState, ReactNode } from 'react'
import type CSSRuntimeProviderProps from './types/provider-props'
// fix: ReferenceError: React is not defined
import React from 'react'
import useIsomorphicLayoutEffect from './uses/useIsomorphicLayoutEffect'
import { useUpdateEffect } from './uses/useUpdateEffect'

export const CSSRuntimeContext = createContext<CSSRuntime | undefined>(undefined)
export const useCSSRuntime = () => useContext(CSSRuntimeContext)

export default function CSSRuntimeProvider(props: CSSRuntimeProviderProps) {
    const cssRuntime = useRef<CSSRuntime>(undefined)
    const [runtime, setRuntime] = useState<CSSRuntime>()

    /** onMounted */
    useIsomorphicLayoutEffect(() => {
        cssRuntime.current = initCSSRuntime(props.config, props.root ?? document)
        setRuntime(cssRuntime.current)
        return () => {
            cssRuntime.current?.destroy()
            cssRuntime.current = undefined
            setRuntime(undefined)
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
            setRuntime(cssRuntime.current)
        }
    }, [props.root])

    return <CSSRuntimeContext.Provider value={runtime}>{props.children}</CSSRuntimeContext.Provider>
}
