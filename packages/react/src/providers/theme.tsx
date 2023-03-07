import { Theme, ThemeConfig, ThemeValue, theme } from '@master/css'
import { ReactElement, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { ThemeContext } from '../contexts'
import { useCSS } from '../contexts/css'

export function ThemeProvider({
    host,
    config = theme,
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
    }, [theme]);

    (typeof window !== 'undefined' ? useLayoutEffect : useEffect)(() => {
        const newTheme = theme || css?.theme || new Theme(host, config)
        setTheme(newTheme)
        setCurrent(newTheme.current)
        setValue(newTheme.value)
        newTheme.host.addEventListener('theme', onThemeChange)
        return () => {
            newTheme.host.removeEventListener('theme', onThemeChange)
        }
    }, [config, css?.theme, host, onThemeChange])

    return <ThemeContext.Provider value={{ ...theme, value, current, set } as Theme}>{children}</ThemeContext.Provider>
}