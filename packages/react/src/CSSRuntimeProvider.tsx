'use client'

import type { Config } from '@master/css'
import { CSSRuntime } from '@master/css-runtime'
import { useEffect, useLayoutEffect, createContext, useContext, useState } from 'react'

export const CSSRuntimeContext = createContext<CSSRuntime | undefined>(undefined)
export const useCSSRuntime = () => useContext(CSSRuntimeContext)

export function CSSRuntimeProvider({ children, config, root }: {
    children: React.ReactNode,
    config?: Config | Promise<any>,
    root?: Document | ShadowRoot
}) {
    const [runtimeCSS, setCSSRuntime] = useState<CSSRuntime>();
    (typeof window !== 'undefined' ? useLayoutEffect : useEffect)(() => {
        let newCSSRuntime: CSSRuntime | undefined = globalThis.runtimeCSSs?.find((eachCSS) => eachCSS.root === root)
        if (newCSSRuntime) {
            setCSSRuntime(newCSSRuntime)
        } else if (!runtimeCSS) {
            const init = (resolvedConfig?: Config) => {
                const existingCSS = globalThis.runtimeCSSs.find((eachCSS) => eachCSS.root === root)
                if (existingCSS) {
                    setCSSRuntime(existingCSS)
                } else {
                    newCSSRuntime = new CSSRuntime(root, resolvedConfig).observe()
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

export default CSSRuntimeProvider