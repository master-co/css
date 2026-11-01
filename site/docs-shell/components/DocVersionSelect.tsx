'use client'

import { useCallback, type SelectHTMLAttributes } from 'react'
import { useApp } from '../contexts/app'
import clsx from 'clsx'

/** A native select; by default invisible over its positioned label (`ui-select[data-variant="overlay"]`), which shows the value. */
export default function DocVersionSelect({ className, ...props }: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'defaultValue' | 'onChange'>) {
  const app = useApp()
  const currentURL = import.meta.env.PUBLIC_URL
  const navigate = useCallback((event: any) => {
    window.location.href = event.target.value
  }, [])
  return (
    <select name="version" defaultValue={currentURL}
      data-variant="overlay" {...props} className={clsx('ui-select', className)}
      onChange={navigate}>
      <option value={currentURL}>v{import.meta.env.PUBLIC_VERSION}</option>
      {app.versions.map(({ name, href }) => <option key={href} value={href}>{name}</option>)}
    </select>
  )

}
