import BenchmarkBars from './BenchmarkBars'
import type { BenchmarkBarItem } from './types'
import Translate from '~/site/docs-shell/components/Translate'

export default function BenchmarkChartGroup({ title, detail = 'Median', items, unit = 'ms' }: {
  title: string
  detail?: string
  items: BenchmarkBarItem[]
  unit?: string
}) {
  return (
    <div className="benchmark-group">
      <div className="benchmark-group-heading">
        <div><span className="benchmark-group-kicker"><Translate>Metric</Translate></span><h4><Translate>{title}</Translate></h4></div>
        <span><Translate>{detail}</Translate> · {unit}</span>
      </div>
      <BenchmarkBars items={items} unit={unit} />
    </div>
  )
}
