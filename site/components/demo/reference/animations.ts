import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'animation': ['animation-name', 'animation-duration', 'animation-iteration-count'],
  'animation-delay': ['animation-delay', 'animation-duration'],
  'animation-direction': ['animation-direction', 'animation-duration'],
  'animation-duration': ['animation-duration', 'animation-fill-mode'],
  'animation-fill-mode': ['animation-fill-mode', 'animation-delay'],
  'animation-iteration-count': ['animation-iteration-count', 'animation-direction'],
  'animation-name': ['animation-name', 'animation-duration'],
  'animation-play-state': ['animation-play-state', 'animation-name'],
  'animation-timing-function': ['animation-timing-function', 'animation-duration'],
}

/** Full authored keyframes and SVGs remain the source of every native timeline. */
export function animations(section: ReferenceDemoSection): DemoScene {
  const managed = section.page !== 'animation-play-state'
  const scene = typeSpecimens(section, {
    appearance: 'plain', properties: properties[section.page],
    caption: managed
      ? 'Play opts into the actual CSS animation. Pause retains its time; Replay restarts even a finished one-shot. Readouts show native timeline time and progress, including delay and fill.'
      : 'The native checkbox and authored selectors control the child’s CSS play state. Pausing preserves its time. Reduced motion keeps it paused; print removes the animation.',
  })
  scene.html = scene.html.replace(/(<div data-ui="type-readings">)([\s\S]*?)(<\/div>)/g, (_, open: string, readings: string, close: string) => {
    const target = readings.match(/data-style-readout="([^"]+)"/)?.[1]
    return `${open}${readings}<span>Timeline <output data-animation-readout="${target}">—</output></span>${close}`
  })
  return { ...scene, motion: managed }
}
