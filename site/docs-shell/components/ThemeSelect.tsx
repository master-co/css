'use client'

import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode'
import clsx from 'clsx'
import type { SelectHTMLAttributes } from 'react'
import { useTranslation } from '../contexts/i18n'

/** A native select; by default invisible over its positioned label (`ui-select[data-variant="overlay"]`), which shows the value. */
export default function ThemeSelect({ className, ...props }: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'defaultValue' | 'onChange'>) {
  const themeMode = useThemeMode()
  const $ = useTranslation()
  return (
    <select data-variant="overlay" {...props} className={clsx('ui-select', className)} value={themeMode.preference}
      onChange={(event) => themeMode.preference = event.target.value}>
      <option value="light">{$('Light')}</option>
      <option value="dark">{$('Dark')}</option>
      <option value="system">{$('System')}</option>
    </select>
  )
}
