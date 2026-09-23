import BenchmarkBars from './BenchmarkBars'
import type { BenchmarkBarItem } from './types'

export default function BenchmarkChartGroup({ title, detail = 'Median', items, unit = 'ms' }: {
  title: string
  detail?: string
  items: BenchmarkBarItem[]
  unit?: string
}) {
  return (
    <div className="benchmark-group">
      <div className="benchmark-group-heading"><h4>{title}</h4><span>{detail}</span></div>
      <BenchmarkBars items={items} unit={unit} />
    </div>
  )
}
