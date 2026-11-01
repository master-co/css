import '~/site/styles/system/specimens.css'
import type { ReactNode } from 'react'
import Translate from '~/site/docs-shell/components/Translate'
import type { BenchmarkTone } from './types'
import { benchmarkStatusTones } from './utils'

interface BenchmarkDeltaProps {
  value?: ReactNode
  label?: ReactNode
  tone?: BenchmarkTone
  children?: ReactNode
  className?: string
}

/** A change between two measurements; its status tone always comes with words. */
export default function BenchmarkDelta(props: BenchmarkDeltaProps) {
  const { value, label, tone = 'neutral', children, className } = props
  const renderedValue = children ?? value

  return (
    <span className={className ? `ui-badge ${className}` : 'ui-badge'} data-tone={benchmarkStatusTones[tone]}>
      <strong>{renderedValue}</strong>
      {label && <span><Translate>{label}</Translate></span>}
    </span>
  )
}
