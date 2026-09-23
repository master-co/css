'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconPlayerPause, IconPlayerPlay, IconRefresh } from '@tabler/icons-react'
import { DemoControls } from './primitives'

export default function DemoMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const element = ref.current
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      element?.getAnimations({ subtree: true }).forEach(animation => animation.pause())
      setPlaying(false)
    }
    sync()
    preference.addEventListener('change', sync)
    return () => preference.removeEventListener('change', sync)
  }, [])
  const control = (action: 'play' | 'pause' | 'restart') => {
    ref.current?.getAnimations({ subtree: true }).forEach(animation => {
      if (action === 'restart') animation.currentTime = 0
      if (action === 'pause') animation.pause()
      else animation.play()
    })
    setPlaying(action !== 'pause')
  }
  return (
    <div className="demo-motion" data-playing={playing}>
      <div ref={ref}>{children}</div>
      <DemoControls label="Animation controls">
        <button type="button" className="demo-button" onClick={() => control(playing ? 'pause' : 'play')}>
          {playing ? <IconPlayerPause size={14} aria-hidden="true" /> : <IconPlayerPlay size={14} aria-hidden="true" />}{playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="demo-button" onClick={() => control('restart')}><IconRefresh size={14} aria-hidden="true" />Replay</button>
      </DemoControls>
    </div>
  )
}
