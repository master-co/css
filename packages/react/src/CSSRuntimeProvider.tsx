'use client'

import { CSSRuntime, initCSSRuntime, resolveRuntimePlan } from '@master/css-runtime'
import { defaultPlan } from '@master/css'
import { createContext, useContext, useRef, useState } from 'react'
import type { CSSRuntimeProviderProps } from './types/provider-props'
// fix: ReferenceError: React is not defined
import React from 'react'
import useIsomorphicLayoutEffect from './uses/useIsomorphicLayoutEffect'
import { useUpdateEffect } from './uses/useUpdateEffect'

export const CSSRuntimeContext = createContext<CSSRuntime | undefined>(undefined)
export const useCSSRuntime = () => useContext(CSSRuntimeContext)

export function CSSRuntimeProvider(props: CSSRuntimeProviderProps) {
    const cssRuntime = useRef<CSSRuntime>(undefined)
    const [runtime, setRuntime] = useState<CSSRuntime>()

    /** onMounted */
    useIsomorphicLayoutEffect(() => {
        cssRuntime.current = initCSSRuntime({
            plan: props.plan || defaultPlan,
            root: props.root ?? document,
            preloaded: props.preloaded
        })
        setRuntime(cssRuntime.current)
        return () => {
            cssRuntime.current?.destroy()
            cssRuntime.current = undefined
            setRuntime(undefined)
        }
    }, [])

    /** on plan change */
    useUpdateEffect(() => {
        if (cssRuntime.current) {
            cssRuntime.current.refresh(resolveRuntimePlan(props.plan || defaultPlan))
        }
    }, [props.plan])

    /** on root change */
    useUpdateEffect(() => {
        if (cssRuntime.current) {
            cssRuntime.current.destroy()
            cssRuntime.current = undefined
            cssRuntime.current = initCSSRuntime({
                plan: props.plan || defaultPlan,
                root: props.root ?? document,
                preloaded: props.preloaded
            })
            setRuntime(cssRuntime.current)
        }
    }, [props.root])

    return <CSSRuntimeContext.Provider value={runtime}>{props.children}</CSSRuntimeContext.Provider>
}
