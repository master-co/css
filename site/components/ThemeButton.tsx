import clsx from 'clsx';
import { useState } from 'react';
import MoonSvg from '~/svgs/moon.svg';
import SunSvg from '~/svgs/sun.svg';
import { useLoaded } from '~/uses/loaded';
import { getLocalStorage } from '~/utils/getLocalStorage';
import { toggleTheme } from '~/utils/toggleTheme';

export default function ThemeButton({ onChange, className }: any) {
    const loaded = useLoaded()
    const [theme, setTheme] = useState(() => getLocalStorage('theme'))
    return (
        <button className={clsx(className, 'f:gold-44@light f:gray-60@dark')}
            onClick={() => {
                const theme = toggleTheme()
                setTheme(theme)
                onChange?.(theme)
            }}>
            {loaded && theme === 'dark'
                ? <MoonSvg height="20" width="20" fill="currentColor" />
                : <SunSvg height="20" width="20" className="fill:gold-80:not(:hover)" />
            }
        </button>
    )
}