import '~/site/styles/system/data.css'
import '~/site/styles/benchmarks.css'
import type { ReactNode } from 'react'
import Translate from '~/site/docs-shell/components/Translate'
import BenchmarkScrollRegion from './BenchmarkScrollRegion'

/** Native disclosure preserves the full server-rendered table; keyboard scrolling is isolated. */
export default function BenchmarkDataTable({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="ui-disclosure" data-variant="rule">
      <summary>
        <Translate>{title}</Translate>
        <span className="ui-disclosure-meta"><Translate>Complete measurements</Translate></span>
      </summary>
      <div className="ui-disclosure-body">
        <BenchmarkScrollRegion title={title}>{children}</BenchmarkScrollRegion>
      </div>
    </details>
  )
}
