import '~/site/styles/system/data.css'
import { BenchmarkBarRows } from './BenchmarkBars'
import type { BenchmarkBarItem } from './types'
import Translate from '~/site/docs-shell/components/Translate'

/** One metric in one chart frame: its name, statistic and unit stay with the bars. */
export default function BenchmarkChartGroup({ title, detail = 'Median', items, unit = 'ms' }: {
  title: string
  detail?: string
  items: BenchmarkBarItem[]
  unit?: string
}) {
  return (
    <div className="ui-chart">
      <div className="ui-chart-head">
        <div><b><Translate>{title}</Translate></b><small><Translate>{detail}</Translate> · {unit}</small></div>
      </div>
      <BenchmarkBarRows items={items} unit={unit} />
    </div>
  )
}
