import { Config, MasterCSS } from '@master/css'
import { ReactElement, useEffect, useLayoutEffect, useState, useMemo, Context, createContext, useContext } from 'react'

export const CSSContext: Context<MasterCSS> = createContext<MasterCSS>(null)

export function useCSS() {
    return useContext(CSSContext)
}

export const CSSProvider = ({
    children,
    config,
    root = typeof document !== 'undefined' ? document : null
}: {
    children: ReactElement,
    config?: Config,
    root?: Document | ShadowRoot | null
}) => {
    const [css] = useState<MasterCSS>(new MasterCSS({ ...config, observe: false }));

    (typeof window !== 'undefined' ? useLayoutEffect : useEffect)(() => {
        css.observe(root)
        return () => {
            css.destroy()
        }
    }, [css, root])

    return <CSSContext.Provider value={css}>{children}</CSSContext.Provider>
}