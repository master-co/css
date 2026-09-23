import type { ReactNode } from 'react'

/** A native disclosure remains usable before JavaScript loads. */
export default function DocumentDisclosure({ title, children, open = false }: { title: string, children: ReactNode, open?: boolean }) {
  // Opening a native disclosure before streamed hydration must preserve that choice.
  return <details className="doc-disclosure" open={open} suppressHydrationWarning>
    <summary>{title}</summary>
    <div className="doc-disclosure-content">{children}</div>
  </details>
}
