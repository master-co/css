import { Config, MasterCSS } from '@master/css'
import { ReactElement, useEffect, useLayoutEffect, Context, createContext, useContext, EffectCallback, DependencyList, useState } from 'react'

const { instances } = MasterCSS
const useIsomorphicEffect: (effect: EffectCallback, deps?: DependencyList) => void =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect
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
    const existingCSS = instances.find((eachCSS) => eachCSS.root === root)
    const [css] = useState<MasterCSS>(existingCSS || new MasterCSS({ ...config, observe: false }))
    useIsomorphicEffect(() => {
        if (!css.observing) {
            css.observe(root)
        } else {
            return () => {
                css.destroy()
            }
        }
    }, [css, root])
    return <CSSContext.Provider value={css}>{children}</CSSContext.Provider>
}