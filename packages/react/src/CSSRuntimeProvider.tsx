'use client'

import type { Config } from '@master/css'
import { RuntimeCSS } from '@master/css-runtime'
import { createContext, useContext, useRef, useCallback, ReactNode } from 'react'
import { useUpdateEffect, useIsomorphicLayoutEffect } from 'react-use'
// fix: ReferenceError: React is not defined
import React from 'react'

export const RuntimeCSSContext = createContext<RuntimeCSS | undefined>(undefined)
export const useRuntimeCSS = () => useContext(RuntimeCSSContext)

export default function CSSRuntimeProvider(props: {
    children?: ReactNode,
    config?: Config | Promise<any>,
    root?: Document | ShadowRoot | null // null for Element.shadowRoot
}) {
    const runtimeCSS = useRef<RuntimeCSS>(undefined)

    const resolveConfig = useCallback(async () => {
        const configModule = await props.config
        return configModule?.config || configModule?.default || configModule
    }, [props.config])

    const initialize = useCallback(async (signal: AbortSignal) => {
        const resolvedConfig = await resolveConfig()
        if (signal.aborted) return
        runtimeCSS.current = new RuntimeCSS(props.root ?? document, resolvedConfig).observe()
    }, [props.root, resolveConfig])

    /** onMounted */
    useIsomorphicLayoutEffect(() => {
        const controller = new AbortController()
        initialize(controller.signal)
        return () => {
            controller.abort()
            runtimeCSS.current?.destroy()
            runtimeCSS.current = undefined
        }
    }, [])

    /** on config change */
    useUpdateEffect(() => {
        const controller = new AbortController();
        (async () => {
            const resolvedConfig = await resolveConfig()
            if (controller.signal.aborted) return
            if (runtimeCSS.current) {
                runtimeCSS.current.refresh(resolvedConfig)
            }
        })()
        return () => {
            controller.abort()
        }
    }, [props.config, resolveConfig])

    /** on root change */
    useUpdateEffect(() => {
        const controller = new AbortController();
        (async () => {
            if (controller.signal.aborted) return
            if (runtimeCSS.current) {
                runtimeCSS.current.destroy()
                runtimeCSS.current = undefined
                initialize(controller.signal)
            }
        })()
        return () => {
            controller.abort()
        }
    }, [initialize, props.root])

    return <RuntimeCSSContext.Provider value={runtimeCSS.current}>{props.children}</RuntimeCSSContext.Provider>
}