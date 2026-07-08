import type { ReactNode } from 'react'
import clsx from 'clsx'
import Translate from '~/internal/components/Translate'
import type { BenchmarkTone } from './types'
import { benchmarkToneTextClasses } from './utils'

interface BenchmarkDeltaProps {
  value?: ReactNode
  label?: ReactNode
  tone?: BenchmarkTone
  children?: ReactNode
  className?: string
}

export default function BenchmarkDelta(props: BenchmarkDeltaProps) {
  const { value, label, tone = 'neutral', children, className } = props
  const renderedValue = children ?? value

  return (
    <span
      className={clsx('inline-flex items-center gap:2xs px:xs py:3xs r:sm font-weight:460 font:xs bg:surface-muted', benchmarkToneTextClasses[tone], className)}>
      <strong>{renderedValue}</strong>
      {label && <span><Translate>{label}</Translate></span>}
    </span>
  )
}
