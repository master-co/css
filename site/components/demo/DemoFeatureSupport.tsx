'use client'

import '~/site/styles/system/specimens.css'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** Reports syntax support only; the example still owns its native CSS behavior. */
export default function DemoFeatureSupport({ condition }: { condition: string }) {
  const supported = useSyncExternalStore(subscribe, () => CSS.supports(condition), () => null)
  return <p className="flex flex-wrap items-center gap-xs m(0)" data-supported={supported ?? 'unknown'}>
    <code className="ui-inline-code">{condition}</code>
    <span className="ui-badge" data-variant="dot" data-tone={supported ? 'green' : undefined}>
      {supported === null ? 'Checking this browser…' : supported ? 'Supported in this browser' : 'Not supported · fallback applies'}
    </span>
  </p>
}
