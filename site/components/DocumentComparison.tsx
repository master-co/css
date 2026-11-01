import '~/site/styles/document-comparison.css'
import type { ReactNode } from 'react'

/** Opt-in wrapper for short, two-column Markdown comparisons: both columns stay visible and wrap. */
export default function DocumentComparison({ children }: { children: ReactNode }) {
  return <div className="document-comparison">{children}</div>
}
