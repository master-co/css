'use client'

import { useThemeMode } from '@master/theme-mode.react'
import clsx from 'clsx'

export default function ThemeSelect({ className, ...props }: any) {
    const themeMode = useThemeMode()
    return (
        <select {...props} className={clsx('abs full cursor:pointer inset:0 opacity:0', className)} value={themeMode.value}
            onChange={(event) => themeMode.preference = event.target.value}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
        </select>
    )
}