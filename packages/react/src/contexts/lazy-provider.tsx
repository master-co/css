import type { Config, MasterCSS } from '@master/css'
import { ReactElement, useEffect, useState } from 'react'
import { CSSContext } from './css'

export const CSSLazyProvider = ({
    children,
    config,
    root = typeof document !== 'undefined' ? document : null
}: {
    children: ReactElement,
    config?: Config | Promise<any>,
    root?: Document | ShadowRoot | null
}) => {
    const [css, setCSS] = useState<MasterCSS>()
    useEffect(() => {
        if (!css) {
            (async () => {
                const { MasterCSS } = await import('@master/css')
                const existingCSS = MasterCSS.instances.find((eachCSS) => eachCSS.root === root)
                const configModule = await config
                const resolvedConfig = configModule.config || configModule.default || configModule
                setCSS(existingCSS || new MasterCSS({ ...resolvedConfig }))
            })()
        }
    }, [config, css, root])
    return <CSSContext.Provider value={css}>{children}</CSSContext.Provider>
}