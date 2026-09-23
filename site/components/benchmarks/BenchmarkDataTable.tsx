import type { ReactNode } from 'react'
import Translate from '~/internal/components/Translate'
import BenchmarkScrollRegion from './BenchmarkScrollRegion'

/** Native disclosure preserves the full server-rendered table; keyboard scrolling is isolated. */
export default function BenchmarkDataTable({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="benchmark-data">
      <summary>
        <span className="benchmark-data-heading">
          <span className="benchmark-data-kicker"><Translate>Data table</Translate></span>
          <strong><Translate>{title}</Translate></strong>
          <span><Translate>Complete measurements · scroll for more columns</Translate></span>
        </span>
        <span aria-hidden="true" className="benchmark-data-chevron" />
      </summary>
      <BenchmarkScrollRegion title={title}>{children}</BenchmarkScrollRegion>
    </details>
  )
}
