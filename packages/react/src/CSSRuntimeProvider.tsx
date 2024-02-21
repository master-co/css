'use client'

import type { Config } from '@master/css'
import { RuntimeCSS } from '@master/css-runtime'
import { useEffect, useLayoutEffect, createContext, useContext, useState } from 'react'

export const CSSRuntimeContext = createContext<RuntimeCSS | undefined>(undefined)
export const useCSSRuntime = () => useContext(CSSRuntimeContext)

export default function CSSRuntimeProvider({ children, config, root }: {
    children: React.ReactNode,
    config?: Config | Promise<any>,
    root?: Document | ShadowRoot
}) {
    const [runtimeCSS, setCSSRuntime] = useState<RuntimeCSS>();
    (typeof window !== 'undefined' ? useLayoutEffect : useEffect)(() => {
        let newCSSRuntime: RuntimeCSS | undefined = globalThis.runtimeCSSs?.find((eachCSS) => eachCSS.root === root)
        if (newCSSRuntime) {
            setCSSRuntime(newCSSRuntime)
        } else if (!runtimeCSS) {
            const init = (resolvedConfig?: Config) => {
                const existingCSS = globalThis.runtimeCSSs.find((eachCSS) => eachCSS.root === root)
                if (existingCSS) {
                    setCSSRuntime(existingCSS)
                } else {
                    newCSSRuntime = new RuntimeCSS(root, resolvedConfig).observe()
                    setCSSRuntime(newCSSRuntime)
                }
            }
            if (config instanceof Promise) {
                (async () => {
                    const configModule = await config
                    init(configModule?.config || configModule?.default || configModule)
                })()
            } else {
                init(config)
            }
        } else if (!runtimeCSS.observing) {
            runtimeCSS.observe()
        }
        return () => {
            newCSSRuntime?.destroy()
        }
    }, [config, root])
    return <CSSRuntimeContext.Provider value={runtimeCSS}>{children}</CSSRuntimeContext.Provider>
}