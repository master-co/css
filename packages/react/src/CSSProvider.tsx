'use client'

import { Config, RuntimeCSS } from '@master/css'
import { useEffect, useLayoutEffect, createContext, useContext, useState } from 'react'

export const CSSContext = createContext<RuntimeCSS | undefined>(undefined)
export const useCSS = () => useContext(CSSContext)

export function CSSProvider({ children, config, root }: {
    children: React.ReactNode,
    config?: Config | Promise<any>,
    root?: Document | ShadowRoot
}) {
    const [runtimeCSS, setRuntimeCSS] = useState<RuntimeCSS>();
    (typeof window !== 'undefined' ? useLayoutEffect : useEffect)(() => {
        let newRuntimeCSS: RuntimeCSS = globalThis.runtimeCSSs?.find((eachCSS) => eachCSS.root === root)
        if (newRuntimeCSS) {
            setRuntimeCSS(newRuntimeCSS)
        } else if (!runtimeCSS) {
            const init = (resolvedConfig?: Config) => {
                const existingCSS = globalThis.runtimeCSSs.find((eachCSS) => eachCSS.root === root)
                if (existingCSS) {
                    setRuntimeCSS(existingCSS)
                } else {
                    newRuntimeCSS = new RuntimeCSS(root, resolvedConfig).observe()
                    setRuntimeCSS(newRuntimeCSS)
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
            newRuntimeCSS?.destroy()
        }
    }, [config, root])
    return <CSSContext.Provider value={runtimeCSS}>{children}</CSSContext.Provider>
}

export default CSSProvider