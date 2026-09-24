'use client'

import { useCallback } from 'react'
import { useApp } from '../contexts/app'

export default function DocVersionSelect() {
  const app = useApp()
  const navigate = useCallback((event: any) => {
    window.location.href = event.target.value
  }, [])
  return (
    <select name="version" defaultValue={process.env.NEXT_PUBLIC_URL}
      className="abs inset:0 full opacity:0 cursor:pointer"
      onChange={navigate}>
      <option value={process.env.NEXT_PUBLIC_URL}>v{process.env.NEXT_PUBLIC_VERSION}</option>
      {app.versions.map(({ name, href }) => <option key={href} value={href}>{name}</option>)}
    </select>
  )

}