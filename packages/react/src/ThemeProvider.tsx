'use client'

import { Options, ThemeValue, ThemeService } from 'theme-service'
import { Context, createContext, DependencyList, EffectCallback, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'

const useIsomorphicEffect: (effect: EffectCallback, deps?: DependencyList) => void =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const ThemeContext: Context<ThemeService> = createContext<ThemeService>(null)

export function useTheme() {
    return useContext(ThemeContext)
}

export function ThemeProvider({
    options,
    host,
    children
}: {
    host?: HTMLElement,
    options?: Options,
    children: JSX.Element,
}) {
    const themeService = useMemo(() => new ThemeService({ ...options, init: false }, host), [options, host])
    // Make React hook theme members
    const [current, setCurrent] = useState<string>(themeService.current)
    const [value, setValue] = useState<ThemeValue>(themeService.value)
    const switchValue = useCallback((value: ThemeValue, options?: {
        store?: boolean;
        emit?: boolean;
    }) => {
        themeService.switch(value, options)
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
        themeService.host.addEventListener('theme', onThemeChange)
        return () => {
            themeService.host.removeEventListener('theme', onThemeChange)
        }
    }, [onThemeChange, themeService])

    return <ThemeContext.Provider value={{ ...themeService, value, current, switch: switchValue } as ThemeService}>{children}</ThemeContext.Provider>
}

export default ThemeProvider