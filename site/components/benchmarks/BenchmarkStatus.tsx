import '~/site/styles/system/specimens.css'
import type { BenchmarkTone } from './types'
import { benchmarkStatusTones } from './utils'

const names: Record<Exclude<BenchmarkTone, 'neutral'>, string> = { good: 'Good', warn: 'Check', bad: 'Regression' }

/** A measured value's status is named, not only colored. */
export default function BenchmarkStatus({ tone }: { tone?: BenchmarkTone }) {
  if (!tone || tone === 'neutral') return null
  return <span className="ui-badge" data-tone={benchmarkStatusTones[tone]} data-variant="dot" data-size="sm">{names[tone]}</span>
}
