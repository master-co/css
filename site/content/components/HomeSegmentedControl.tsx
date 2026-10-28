'use client'

import { useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'

export interface HomeSegmentedControlOption<Value extends string> {
  label: ReactNode
  value: Value
}

export interface HomeSegmentedControlProps<Value extends string> extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange' | 'role'> {
  onValueChange: (value: Value) => void
  options: readonly HomeSegmentedControlOption<Value>[]
  value: Value
}

/** A pill track whose thumb slides to the chosen option, sized to that option's label. */
export default function HomeSegmentedControl<Value extends string>({ className, onValueChange, options, style, value, ...props }: HomeSegmentedControlProps<Value>) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ x: number, width: number }>()

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => {
      const active = track.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (active) setThumb({ x: active.offsetLeft, width: active.offsetWidth })
    }
    measure()
    // Fonts and container queries can change a label's width after the first paint.
    const resize = new ResizeObserver(measure)
    resize.observe(track)
    return () => resize.disconnect()
  }, [value])

  return (
    <div
      className={clsx('home-segmented-control', className)}
      data-ready={thumb ? '' : undefined}
      ref={trackRef}
      role="group"
      style={{ ...style, ...(thumb && { '--home-segment-x': `${thumb.x}px`, '--home-segment-width': `${thumb.width}px` }) } as CSSProperties}
      {...props}>
      <span aria-hidden="true" className="home-segmented-control-thumb" />
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            aria-pressed={active}
            className="home-segmented-control-option"
            key={option.value}
            onClick={() => {
              if (!active) onValueChange(option.value)
            }}
            type="button">
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
