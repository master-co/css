'use client'

import { useCallback } from 'react'
import { useApp } from '../contexts/app'

export default function DocVersionSelect() {
  const app = useApp()
  const navigate = useCallback((event: any) => {
    window.location.href = event.target.value
  }, [])
  return (
    <select name="version" defaultValue={import.meta.env.PUBLIC_URL}
      className="position:absolute inset:0 height:100% width:100% opacity:0 cursor:pointer"
      onChange={navigate}>
      <option value={import.meta.env.PUBLIC_URL}>v{import.meta.env.PUBLIC_VERSION}</option>
      {app.versions.map(({ name, href }) => <option key={href} value={href}>{name}</option>)}
    </select>
  )

}