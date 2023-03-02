import { Theme, ThemeConfig, ThemeValue, themeConfig } from '@master/css'
import { createContext, ReactElement, useCallback, useContext, useState } from 'react'
import { useIsomorphicEffect } from '../uses'
import { useCSS } from './css'

const ThemeContext = createContext<Theme>(null)

export const ThemeProvider = ({
    host,
    config = themeConfig,
    children
}: {
    host?: HTMLElement,
    config?: ThemeConfig,
    children: ReactElement,
}) => {
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

export function useTheme() {
    return useContext(ThemeContext)
}