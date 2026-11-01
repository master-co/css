'use client'

import { useEffect, useId, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import Demo from './Demo'

/** One tray whose tools change a real wrapper's width; children own their query container and layout. */
export default function DemoContainer({ children, title, caption, maxWidth = 720, ...props }: HTMLAttributes<HTMLElement> & {
  children: ReactNode, title: string, caption?: ReactNode, maxWidth?: number
}) {
  const [width, setWidth] = useState<number>()
  const [measured, setMeasured] = useState(480)
  const [minimumWidth, setMinimumWidth] = useState(240)
  const [ready, setReady] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    const element = ref.current!
    const stage = element.parentElement!
    const observer = new ResizeObserver(() => {
      setMeasured(Math.round(element.getBoundingClientRect().width))
      const style = getComputedStyle(stage)
      const available = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      setMinimumWidth(Math.min(240, Math.round(available), maxWidth))
      setReady(true)
    })
    observer.observe(element)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [maxWidth])
  const value = width ?? Math.min(measured, maxWidth)
  const range = Math.max(1, maxWidth - minimumWidth)
  return <Demo {...props} title={title} caption={caption} padding="sm" data-ready={ready} controls={<>
    <label className="ui-label" data-case="as-is" htmlFor={id}>Container</label>
    <input id={id} className="ui-range" type="range" min={minimumWidth} max={maxWidth} step="1" disabled={!ready} value={value}
      style={{ '--value': `${((value - minimumWidth) / range) * 100}%`, width: '128px', maxWidth: '100%' } as CSSProperties}
      onChange={event => setWidth(Number(event.target.value))} />
    <button type="button" className="ui-button" data-size="sm" disabled={!ready} onClick={() => setWidth(undefined)}>Fit</button>
    <output className="ui-label" data-case="as-is">{ready ? `${measured} px · viewport unchanged` : 'Measuring container…'}</output>
  </>}>
    <div ref={ref} data-demo-container="" style={{ width: width ? `${width}px` : `min(100%, ${maxWidth}px)`, maxWidth: '100%' }}>{children}</div>
  </Demo>
}
