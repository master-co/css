import type { ReactNode } from 'react'

/** A native disclosure remains usable before JavaScript loads; its body reads like the article. */
export default function DocumentDisclosure({ title, children, open = false }: { title: string, children: ReactNode, open?: boolean }) {
  // Opening a native disclosure before streamed hydration must preserve that choice.
  return <details className="ui-disclosure" data-variant="rule" open={open} suppressHydrationWarning>
    <summary>{title}</summary>
    <div className="ui-disclosure-body ui-prose">{children}</div>
  </details>
}
