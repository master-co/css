export type PlaybackAction = 'play' | 'pause' | 'restart'

/** Keep the browser's CSS Animation objects, including finished animations without fill. */
export function demoPlayback(doc: Document, managed: boolean, changed: (playing: boolean) => void, update: () => void) {
  const animations = new Set<Animation>()
  let frame = 0, lastReading = -Infinity, disposed = false
  const collect = () => {
    const current: Animation[] = doc.getAnimations().filter(animation => 'animationName' in animation)
    current.forEach(animation => animations.add(animation))
    animations.forEach(animation => {
      const target = (animation.effect as KeyframeEffect | null)?.target
      if (!target?.isConnected || animation.playState === 'idle' && !current.includes(animation)) animations.delete(animation)
    })
    return [...animations]
  }
  const read = (all: Animation[]) => {
    doc.querySelectorAll<HTMLOutputElement>('[data-animation-readout]').forEach(output => {
      const target = doc.getElementById(output.dataset.animationReadout!)
      const animation = all.find(item => (item.effect as KeyframeEffect | null)?.target === target)
      const timing = animation?.effect?.getComputedTiming()
      const value = animation ? `${animation.playState} · ${Math.round(Number(animation.currentTime ?? 0))}ms${timing?.progress == null ? '' : ` · ${Math.round(timing.progress * 100)}%`}` : 'No animation'
      if (output.textContent !== value) output.textContent = value
    })
  }
  const refresh = () => {
    if (disposed) return
    const all = collect()
    read(all)
    update()
    const running = all.some(animation => animation.playState === 'running')
    if (managed) changed(running)
    if (running && !frame) frame = requestAnimationFrame(tick)
  }
  const tick = (time: number) => {
    frame = 0
    if (disposed) return
    const running = collect().some(animation => animation.playState === 'running')
    if (!running || time - lastReading >= 100) { lastReading = time; refresh() }
    else frame = requestAnimationFrame(tick)
  }
  const pause = () => {
    if (!managed) return
    doc.documentElement.dataset.demoPaused = ''
    collect().forEach(animation => animation.pause())
    refresh()
  }
  const act = (action: PlaybackAction) => {
    if (!managed) return
    if (action === 'pause') { pause(); return }
    doc.documentElement.dataset.motionAllowed = ''
    delete doc.documentElement.dataset.demoPaused
    collect().forEach(animation => {
      if (action === 'restart') animation.currentTime = 0
      animation.play()
    })
    refresh()
  }
  const events = ['animationstart', 'animationiteration', 'animationend', 'animationcancel', 'input', 'change', 'pointerover', 'pointerout', 'focusin', 'focusout']
  events.forEach(event => doc.addEventListener(event, refresh))
  doc.defaultView?.addEventListener('resize', refresh)
  if (managed) pause()
  else refresh()
  return {
    act, pause, refresh,
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      events.forEach(event => doc.removeEventListener(event, refresh))
      doc.defaultView?.removeEventListener('resize', refresh)
      animations.clear()
    },
  }
}
