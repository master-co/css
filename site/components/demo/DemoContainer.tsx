'use client'

import '~/site/styles/demo-interactions.css'
import '~/site/styles/demo.css'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import ResizeZone from '~/site/docs-shell/components/ResizeZone'
import { DemoControls } from './primitives'

/** Changes a real wrapper's width; children own their query container and layout. */
export default function DemoContainer({ children, title, maxWidth = 720 }: {
  children: ReactNode, title: string, maxWidth?: number
}) {
  const [width, setWidth] = useState<number>()
  const [measured, setMeasured] = useState(480)
  const [minimumWidth, setMinimumWidth] = useState(240)
  const [ready, setReady] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    const element = ref.current!
    const shell = shellRef.current!
    const observer = new ResizeObserver(() => {
      setMeasured(Math.round(element.getBoundingClientRect().width))
      const style = getComputedStyle(shell)
      const available = shell.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      setMinimumWidth(Math.min(240, Math.round(available), maxWidth))
      setReady(true)
    })
    observer.observe(element)
    observer.observe(shell)
    return () => observer.disconnect()
  }, [maxWidth])
  return <div data-demo-container data-ready={ready}>
    <div ref={shellRef} className="demo-container-shell">
      <ResizeZone width={width ? `${width}px` : `min(100%, ${maxWidth}px)`} originX="center" showHandler={false}>
        <div ref={ref}>{children}</div>
      </ResizeZone>
    </div>
    <div className="demo-viewport-toolbar">
      <DemoControls label={`${title} controls`}>
        <label className="demo-label" htmlFor={id}>Container</label>
        <input id={id} type="range" min={minimumWidth} max={maxWidth} step="1" disabled={!ready} value={width ?? Math.min(measured, maxWidth)} onChange={event => setWidth(Number(event.target.value))} />
        <button type="button" className="demo-button" disabled={!ready} onClick={() => setWidth(undefined)}>Fit</button>
      </DemoControls>
      <output className="demo-viewport-status">{ready ? `${measured} px · viewport unchanged` : 'Measuring container…'}</output>
    </div>
  </div>
}
