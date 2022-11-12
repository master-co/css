import type MasterCSS from '@master/css'
import { useEffect, useState } from 'react'

export const useScheme = (css: MasterCSS) => {
    const [scheme, setScheme] = useState(css.scheme)
    const [theme, setTheme] = useState(css.theme)

    useEffect(() => {
        css.scheme = scheme
    }, [scheme, css])

    useEffect(() => {
        const onThemeChange = () => {
            setTheme(css.theme)
        }
        const onSchemeChange = (() => {
            setScheme(css.scheme)
        })
        css.host.addEventListener('theme', onThemeChange)
        css.host.addEventListener('scheme', onSchemeChange)
        return () => {
            css.host.removeEventListener('change', onThemeChange)
            css.host.removeEventListener('scheme', onSchemeChange)
        }
    }, [css.host, css.scheme, css.theme])

    return { scheme, setScheme, theme }
}