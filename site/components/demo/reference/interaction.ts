import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'accent-color': ['accent-color'], 'appearance': ['appearance'],
  'caret-color': ['caret-color', 'color'], 'cursor': ['cursor'],
  'pointer-events': ['pointer-events'], 'resize': ['resize'],
  'screen-readers': ['position', 'width', 'height'],
  'touch-action': ['touch-action'], 'user-drag': ['-webkit-user-drag'],
  'user-select': ['user-select'],
}
const captions: Record<string, string> = {
  'accent-color': 'Use the actual checkbox, radio group and range. The browser and platform decide how a requested accent is painted; the controls retain their native keyboard behavior.',
  'appearance': 'The full authored select and its options remain native. Change its value with the platform picker or keyboard; appearance changes paint without replacing the accessible label.',
  'caret-color': 'Focus and edit the named text field. The insertion caret, text color, focus outline and mouse pointer are separate. Native blinking may hide the caret in a still image.',
  'cursor': 'The cursor is a platform-rendered affordance. Try the real disclosure, reset control or native draggable image; the cursor itself does not implement the action.',
  'pointer-events': 'Pointer hit testing and keyboard access are independent. Use the real checkbox or reset button to verify the action; transparent overlays keep their authored geometry.',
  'resize': 'Drag the native resize handle where supported. The readout measures the real control box as it changes. Editing and scrolling remain available when handles are absent.',
  'screen-readers': 'Visible annotations explain the actual accessible name or description. Use Tab to reach the visible native control; its hidden label is not a separate focus target.',
  'touch-action': 'Swipe on a touch device to test native panning. Keyboard scrolling remains available. The rules allow or restrict browser gestures; no custom drawing or drag handler is supplied.',
  'user-drag': 'Try a native pointer drag in a supporting browser. The event readout observes actual drag starts; vendor property support and touch behavior depend on the platform.',
  'user-select': 'Use the platform’s text-selection gesture on the authored content. Selection rules do not disable native control actions or protect text from copying.',
}

/** Native controls, their labels and the complete teaching context stay authored in MDX. */
export function interaction(section: ReferenceDemoSection): DemoScene {
  const scene = typeSpecimens(section, {
    appearance: 'plain', properties: properties[section.page], caption: captions[section.page],
    measure: section.page === 'resize', measureLabel: 'Control box',
  })
  if (section.page === 'touch-action' || section.page === 'user-drag') {
    scene.html = scene.html.replace(/(<div data-ui="type-readings">)([\s\S]*?)(<\/div>)/g, (_, open: string, readings: string, close: string) => {
      const target = readings.match(/data-style-readout="([^"]+)"/)?.[1]
      return section.page === 'touch-action' && section.id !== 'optimize-tap-controls'
        ? `${open}${readings}<span>Scroll <output data-scroll-readout="${target}">—</output></span>${close}`
        : section.page === 'user-drag'
          ? `${open}${readings.replace('data-style-property="-webkit-user-drag"', 'data-style-property="-webkit-user-drag" data-empty-value="Not exposed"')}<span>Native drag <output data-drag-readout="${target}">No start observed</output></span>${close}`
          : `${open}${readings}${close}`
    })
  }
  return scene
}
