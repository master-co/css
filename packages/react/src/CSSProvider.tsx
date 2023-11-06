'use client'

import MasterCSS, { Config, initRuntime } from '@master/css'
import { useEffect, useLayoutEffect, createContext, useContext, useState } from 'react'

export const CSSContext = createContext<MasterCSS | undefined>(undefined)

export function useCSS() {
    return useContext(CSSContext)
}

export function CSSProvider({
    children,
    config,
    root = typeof document !== 'undefined' ? document : null
}: {
    children: React.ReactNode,
    config?: Config | Promise<any>,
    root?: Document | ShadowRoot | null
}) {
    const [css, setCSS] = useState<MasterCSS>();
    (typeof window !== 'undefined' ? useLayoutEffect : useEffect)(() => {
        let newCSS: MasterCSS = window.masterCSSs?.find((eachCSS) => eachCSS.root === root)
        if (newCSS) {
            setCSS(newCSS)
        } else if (!css) {
            const init = (resolvedConfig?: Config) => {
                const existingCSS = window.masterCSSs.find((eachCSS) => eachCSS.root === root)
                if (existingCSS) {
                    setCSS(existingCSS)
                } else {
                    newCSS = initRuntime(resolvedConfig, root)
                    setCSS(newCSS)
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
        } else if (!css.observing) {
            css.observe(root)
        }
        return () => {
            newCSS?.destroy()
        }
    }, [config, root])
    return <CSSContext.Provider value={css}>{children}</CSSContext.Provider>
}

export default CSSProvider