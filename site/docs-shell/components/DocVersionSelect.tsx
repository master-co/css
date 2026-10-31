'use client'

import { useCallback, type SelectHTMLAttributes } from 'react'
import { useApp } from '../contexts/app'
import clsx from 'clsx'

export default function DocVersionSelect({ className, ...props }: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'defaultValue' | 'onChange'>) {
  const app = useApp()
  const currentURL = import.meta.env.PUBLIC_URL
  const navigate = useCallback((event: any) => {
    window.location.href = event.target.value
  }, [])
  return (
    <select {...props} name="version" defaultValue={currentURL}
      className={clsx('absolute (inset:0) (height:100%) (width:100%) (opacity:0) (cursor:pointer) doc-preference-select', className)}
      onChange={navigate}>
      <option value={currentURL}>v{import.meta.env.PUBLIC_VERSION}</option>
      {app.versions.map(({ name, href }) => <option key={href} value={href}>{name}</option>)}
    </select>
  )

}
