'use client'

import '~/site/styles/demo-feature-support.css'
import '~/site/styles/demo.css'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** Reports syntax support only; the example still owns its native CSS behavior. */
export default function DemoFeatureSupport({ condition }: { condition: string }) {
  const supported = useSyncExternalStore(subscribe, () => CSS.supports(condition), () => null)
  return <p className="demo-feature-support" data-supported={supported ?? 'unknown'}>
    <code>{condition}</code>
    <span>{supported === null ? 'Checking this browser…' : supported ? 'Supported in this browser' : 'Not supported · fallback applies'}</span>
  </p>
}
