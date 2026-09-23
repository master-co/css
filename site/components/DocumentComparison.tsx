import type { ReactNode } from 'react'

/** Opt-in wrapper for short, two-column Markdown comparisons in reading layouts. */
export default function DocumentComparison({ children }: { children: ReactNode }) {
  return <div className="doc-comparison">{children}</div>
}
