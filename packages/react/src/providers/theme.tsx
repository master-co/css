import { Theme, ThemeConfig, ThemeValue, theme as themeConfig } from '@master/css'
import { ReactElement, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { ThemeContext } from '../contexts'
import { useCSS } from '../contexts/css'

const useIsomorphicEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function ThemeProvider({
    host,
    config = themeConfig,
    children
}: {
    host?: HTMLElement,
    config?: ThemeConfig,
    children: ReactElement,
}) {
    const css = useCSS()
    const [theme, setTheme] = useState<Theme>(css?.theme)
    const [current, setCurrent] = useState<string>(theme?.current)
    const [value, setValue] = useState<ThemeValue>(theme?.value)

    const set = useCallback((value: ThemeValue, options?: {
        store?: boolean;
        emit?: boolean;
    }) => {
        theme.set(value, options)
        setCurrent(theme.current)
        setValue(theme.value)
    }, [theme])

    const onThemeChange = useCallback(() => {
        setCurrent(theme.current)
        setValue(theme.value)
    }, [theme])

    useIsomorphicEffect(() => {
        setTheme(css?.theme || theme || new Theme(host, config))
    }, [config, css?.theme, host, onThemeChange])

    useIsomorphicEffect(() => {
        if (!theme) return
        set(theme.value, { emit: false, store: false })
        theme.host.addEventListener('theme', onThemeChange)
        return () => {
            theme.host.removeEventListener('theme', onThemeChange)
        }
    }, [theme])

    return <ThemeContext.Provider value={{ ...theme, value, current, set } as Theme}>{children}</ThemeContext.Provider>
}