import { Config, MasterCSS } from '@master/css'
import { ReactElement, useState } from 'react'
import { useIsomorphicEffect } from '../uses/isomorphic-effect'
import { CSSContext } from './css'

export const CSSProvider = ({
    children,
    config,
    root = typeof document !== 'undefined' ? document : null
}: {
    children: ReactElement,
    config?: Config,
    root?: Document | ShadowRoot | null
}) => {
    const [css] = useState<MasterCSS>(new MasterCSS({ ...config, observe: false }))

    useIsomorphicEffect(() => {
        css.observe(root)
        return () => {
            css.destroy()
        }
    }, [css, root])

    return <CSSContext.Provider value={css}>{children}</CSSContext.Provider>
}