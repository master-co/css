'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconPlayerPause, IconPlayerPlay, IconRefresh } from '@tabler/icons-react'

/** Play, pause and replay the native animations inside; they start paused and respect reduced motion. */
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
    <div className="grid gap-md w-full">
      <div ref={ref} data-playback={playing ? 'playing' : 'paused'}>{children}</div>
      <div className="ui-player" role="group" aria-label="Animation controls" data-state={playing ? 'playing' : 'paused'}>
        <button type="button" className="ui-button" data-size="sm" onClick={() => control(playing ? 'pause' : 'play')}>
          {playing ? <IconPlayerPause aria-hidden="true" /> : <IconPlayerPlay aria-hidden="true" />}{playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="ui-button" data-size="sm" data-variant="quiet" onClick={() => control('restart')}><IconRefresh aria-hidden="true" />Replay</button>
        <span className="ui-player-time"><output>{playing ? 'Playing' : 'Paused'}</output></span>
      </div>
    </div>
  )
}
