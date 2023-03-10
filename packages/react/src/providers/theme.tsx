import { ThemeSettings, ThemeValue, Theme } from '@master/css'
import { DependencyList, EffectCallback, ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { ThemeContext } from '../contexts'

const useIsomorphicEffect: (effect: EffectCallback, deps?: DependencyList) => void =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function ThemeProvider({
    config,
    host,
    children
}: {
    host?: HTMLElement,
    config?: ThemeSettings,
    children: ReactElement,
}) {
    const theme = useMemo(() => new Theme({ ...config, init: false }, host), [config, host])
    // Make React hook theme members
    const [current, setCurrent] = useState<string>(theme.current)
    const [value, setValue] = useState<ThemeValue>(theme.value)
    const switchValue = useCallback((value: ThemeValue, options?: {
        store?: boolean;
        emit?: boolean;
    }) => {
        theme.switch(value, options)
        setCurrent(theme.current)
        setValue(theme.value)
    }, [theme])

    const onThemeChange = useCallback(() => {
        setCurrent(theme.current)
        setValue(theme.value)
    }, [theme])

    useIsomorphicEffect(() => {
        theme.init()
        setCurrent(theme.current)
        setValue(theme.value)
        theme.host.addEventListener('theme', onThemeChange)
        return () => {
            theme.host.removeEventListener('theme', onThemeChange)
        }
    }, [onThemeChange, theme])

    return <ThemeContext.Provider value={{ ...theme, value, current, switch: switchValue } as Theme}>{children}</ThemeContext.Provider>
}