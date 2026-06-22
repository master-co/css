'use client'

import { CSSRuntime } from '@master/css-runtime'
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

    const initRuntime = async () => {
        const nextRuntime = CSSRuntime.create({
            manifest: props.manifest,
            root: props.root ?? document,
            emittedGlobals: props.emittedGlobals,
            hydrationManifest: props.hydrationManifest
        })
        if (nextRuntime.needsHydrationManifest()) {
            await nextRuntime.loadHydrationManifest()
        }
        return nextRuntime.observe()
    }

    const acceptRuntime = (nextRuntime: CSSRuntime, active: boolean) => {
        if (!active) {
            if (!cssRuntime.current) {
                nextRuntime.destroy()
            }
            return
        }
        cssRuntime.current = nextRuntime
        setRuntime(nextRuntime)
    }

    /** onMounted */
    useIsomorphicLayoutEffect(() => {
        let active = true
        void initRuntime().then((nextRuntime) => acceptRuntime(nextRuntime, active))
        return () => {
            active = false
            cssRuntime.current?.destroy()
            cssRuntime.current = undefined
            setRuntime(undefined)
        }
    }, [])

    /** on manifest change */
    useUpdateEffect(() => {
        if (cssRuntime.current) {
            cssRuntime.current.refresh(props.manifest)
        }
    }, [props.manifest])

    /** on root change */
    useUpdateEffect(() => {
        if (cssRuntime.current) {
            cssRuntime.current.destroy()
            cssRuntime.current = undefined
        }
        setRuntime(undefined)
        let active = true
        void initRuntime().then((nextRuntime) => acceptRuntime(nextRuntime, active))
        return () => {
            active = false
        }
    }, [props.root])

    return <CSSRuntimeContext.Provider value={runtime}>{props.children}</CSSRuntimeContext.Provider>
}
