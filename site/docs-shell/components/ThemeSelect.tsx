'use client'

import { useThemeMode } from '@master/theme-mode.react'
import clsx from 'clsx'
import { useTranslation } from '../contexts/i18n'

export default function ThemeSelect({ className, ...props }: any) {
  const themeMode = useThemeMode()
  const $ = useTranslation()
  return (
    <select {...props} className={clsx('abs inset:0 full opacity:0 cursor:pointer', className)} value={themeMode.preference}
      onChange={(event) => themeMode.preference = event.target.value}>
      <option value="light">{$('Light')}</option>
      <option value="dark">{$('Dark')}</option>
      <option value="system">{$('System')}</option>
    </select>
  )
}