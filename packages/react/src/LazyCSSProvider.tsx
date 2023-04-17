import type { MasterCSS, Config } from '@master/css'
import { useEffect, useState } from 'react'
import { Context, createContext, useContext } from 'react'

export const LazyCSSContext: Context<MasterCSS> = createContext<MasterCSS>(null)

export function useLazyCSS() {
    return useContext(LazyCSSContext)
}

export const LazyCSSProvider = ({
    children,
    config,
    root = typeof document !== 'undefined' ? document : null
}: {
    children: JSX.Element,
    config?: Config | Promise<any>,
    root?: Document | ShadowRoot | null
}) => {
    const [css, setCSS] = useState<MasterCSS>()
    useEffect(() => {
        if (!css) {
            Promise.all([import('@master/css'), config])
                .then(([{ MasterCSS }, configModule]) => {
                    const { instances } = MasterCSS
                    const existingCSS = instances.find((eachCSS) => eachCSS.root === root)
                    if (existingCSS) {
                        setCSS(existingCSS)
                    } else {
                        const resolvedConfig = configModule?.config || configModule?.default || configModule
                        setCSS(new MasterCSS(resolvedConfig))
                    }
                })
            return () => {
                if (css) {
                    css.disconnect()
                }
            }
        }
    }, [config, css, root])
    return <LazyCSSContext.Provider value={css}>{children}</LazyCSSContext.Provider>
}