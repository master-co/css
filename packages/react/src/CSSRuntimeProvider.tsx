'use client'

import type { Config } from '@master/css'
import { RuntimeCSS } from '@master/css-runtime'
import React, { useEffect, useLayoutEffect, createContext, useContext, useState, useRef } from 'react'

export const RuntimeCSSContext = createContext<RuntimeCSS | undefined>(undefined)
export const useRuntimeCSS = () => useContext(RuntimeCSSContext)

export default function CSSRuntimeProvider({ children, config, root }: {
    children: React.ReactNode,
    config?: Config | Promise<any>,
    root?: Document | ShadowRoot
}) {
    const [runtimeCSS, setCSSRuntime] = useState<RuntimeCSS>()
    const identifier = useRef<number>(0)
    const initializing = useRef<boolean>(false)
    const newRuntimeCSS = useRef<RuntimeCSS | undefined>(undefined)
    const isExternalRuntimeCSS = useRef<boolean>(false)

    const waitInitialized = async () => {
        const currentIdentifier = ++identifier.current
        if (initializing.current) {
            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    if (!initializing.current) {
                        clearInterval(interval)
                        resolve()
                    }
                }, 10)
            })
        }
        return currentIdentifier === identifier.current
    }

    (typeof window !== 'undefined' ? useLayoutEffect : useEffect)(() => {
        (async () => {
            if (!await waitInitialized())
                return

            const configModule = await config
            const resolvedConfig = configModule?.config || configModule?.default || configModule

            const init = async () => {
                initializing.current = true

                const currentRoot = root ?? document
                const existingCSSRuntime = (globalThis as any).runtimeCSSs.find((eachCSS: RuntimeCSS) => eachCSS.root === currentRoot)
                if (existingCSSRuntime) {
                    setCSSRuntime(newRuntimeCSS.current = existingCSSRuntime)
                    isExternalRuntimeCSS.current = true
                } else {
                    setCSSRuntime(newRuntimeCSS.current = new RuntimeCSS(root, resolvedConfig).observe())
                    isExternalRuntimeCSS.current = false
                }

                initializing.current = false
            }

            if (!newRuntimeCSS.current) {
                await init()
            } else if (
                newRuntimeCSS.current.root !== root
                && (root || newRuntimeCSS.current.root !== document)
            ) {
                newRuntimeCSS.current.destroy()
                await init()
            } else {
                newRuntimeCSS.current.refresh(resolvedConfig)
            }
        })()
    }, [config, root])

    useEffect(() => {
        return () => {
            if (!isExternalRuntimeCSS.current) {
                (async () => {
                    if (!await waitInitialized())
                        return

                    newRuntimeCSS.current?.destroy()
                    newRuntimeCSS.current = undefined
                })()
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <RuntimeCSSContext.Provider value={runtimeCSS}>{children}</RuntimeCSSContext.Provider>
}