'use client'

import { Config, MasterCSS } from '@master/css'
import { useEffect, useLayoutEffect, Context, createContext, useContext, EffectCallback, DependencyList, useState } from 'react'

const { instances } = MasterCSS

const useIsomorphicEffect: (effect: EffectCallback, deps?: DependencyList) => void =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect
export const CSSContext: Context<MasterCSS> = createContext<MasterCSS>(null)

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
    const [css, setCSS] = useState<MasterCSS>(instances.find((eachCSS) => eachCSS.root === root))
    useIsomorphicEffect(() => {
        let newCSS: MasterCSS
        if (!css) {
            const init = (resolvedConfig: Config) => {
                const existingCSS = instances.find((eachCSS) => eachCSS.root === root)
                if (existingCSS) {
                    setCSS(existingCSS)
                } else {
                    newCSS = new MasterCSS(resolvedConfig)
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