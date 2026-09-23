'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/** A dedicated measurement wrapper, never inserted between layout items and their parent. */
export default function DemoMeasure({ children, label = 'Bounds' }: { children: ReactNode, label?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number, height: number }>()
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      const bounds = element.getBoundingClientRect()
      setSize({ width: Math.round(bounds.width), height: Math.round(bounds.height) })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="demo-measure">
      <div className="demo-measure-line"><span>{label}{size && ` · ${size.width} × ${size.height} px`}</span></div>
      <div ref={ref}>{children}</div>
    </div>
  )
}
