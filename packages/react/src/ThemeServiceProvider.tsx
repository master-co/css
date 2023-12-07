'use client'

import { Options, ThemeValue, ThemeService } from 'theme-service'
import { Context, createContext, DependencyList, EffectCallback, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'

const useIsomorphicEffect: (effect: EffectCallback, deps?: DependencyList) => void =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const ThemeServiceContext: Context<ThemeService | null> = createContext<ThemeService | null>(null)

export function useThemeService() {
    return useContext(ThemeServiceContext)
}

export function ThemeServiceProvider({
    options,
    host,
    children
}: {
    host?: HTMLElement,
    options?: Options,
    children: JSX.Element,
}) {
    const themeService = useMemo(() => new ThemeService(options, host), [options, host])
    // Make React hook theme members
    const [current, setCurrent] = useState<string>(themeService.current)
    const [value, setValue] = useState<ThemeValue>(themeService.value)

    const switchValue = useCallback((value: ThemeValue, options?: {
        store?: boolean;
        emit?: boolean;
    }) => {
        themeService.switch(value)
        setCurrent(themeService.current)
        setValue(themeService.value)
    }, [themeService])

    const onThemeChange = useCallback(() => {
        setCurrent(themeService.current)
        setValue(themeService.value)
    }, [themeService])

    useIsomorphicEffect(() => {
        themeService.init()
        setCurrent(themeService.current)
        setValue(themeService.value)
        themeService.host.addEventListener('themeChange', onThemeChange)
        return () => {
            themeService.host.removeEventListener('themeChange', onThemeChange)
            themeService.destroy(false)
        }
    }, [onThemeChange, themeService])

    return <ThemeServiceContext.Provider value={{ ...themeService, value, current, switch: switchValue } as ThemeService}>{children}</ThemeServiceContext.Provider>
}

export default ThemeServiceProvider