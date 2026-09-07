'use client'

import { useState } from 'react'

export default function CopyExample({ value, locale }: { value: string; locale: string }) {
  const [status, setStatus] = useState('')
  const tw = locale === 'tw'
  return <span>
    <button onClick={async () => {
      try { await navigator.clipboard.writeText(value); setStatus(tw ? '已複製 class' : 'Class copied') }
      catch { setStatus(tw ? '請從範例選取並複製 class' : 'Select and copy the class from the example') }
    }}>{tw ? '複製範例 class' : 'Copy example class'}</button>
    <span role="status" className="ml:xs text:muted">{status}</span>
  </span>
}
