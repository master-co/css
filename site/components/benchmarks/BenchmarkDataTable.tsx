import type { ReactNode } from 'react'
import BenchmarkScrollRegion from './BenchmarkScrollRegion'

/** Native disclosure preserves the full server-rendered table; keyboard scrolling is isolated. */
export default function BenchmarkDataTable({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="benchmark-data">
      <summary>{title}<span>Complete data · scroll for more columns</span></summary>
      <BenchmarkScrollRegion title={title}>{children}</BenchmarkScrollRegion>
    </details>
  )
}
