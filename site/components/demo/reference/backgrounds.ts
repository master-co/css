import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  color: ['color', 'opacity'],
  background: ['background-color', 'background-image', 'background-position', 'background-size', 'background-repeat'],
  'background-color': ['background-color', 'opacity'],
  'background-image': ['background-image'],
  'background-attachment': ['background-attachment'],
  'background-blend-mode': ['background-blend-mode'],
  'background-clip': ['background-clip'],
  'background-origin': ['background-origin', 'background-size'],
  'background-position': ['background-position', 'background-size'],
  'background-repeat': ['background-repeat', 'background-size'],
  'background-size': ['background-size'],
}
const captions: Record<string, string> = {
  color: 'The foreground and element opacity are independent readings. The specimen keeps the actual authored theme and interaction rules.',
  background: 'Each specimen supplies its own image and geometry. Read the longhands separately to see what the shorthand changes or resets.',
  'background-color': 'The backing surface belongs to the authored example. Background alpha changes the paint without reducing the element’s opacity.',
  'background-image': 'The image list is the browser’s computed value. The first listed layer paints above the others; dimensions and repeat behavior come from the example.',
  'background-attachment': 'Scroll both the inner panel and this preview page. Fixed attachment refers to the iframe viewport; local refers to the scrollable content. Actual paint support can vary by platform.',
  'background-blend-mode': 'Only the authored background layers blend. The surrounding surface and labels stay outside the subject’s background group.',
  'background-clip': 'The plain specimen adds no paint or clipping to the subject. Compare the painted boundary with the unchanged layout dimensions.',
  'background-origin': 'Origin determines the image’s positioning area. Clipping stays separately authored, so positioning and painting boundaries remain distinct.',
  'background-position': 'Percentages distribute the difference between area and image size. The computed position can remain a percentage; it is not a measured pixel offset.',
  'background-repeat': 'The source image and tile dimensions remain fixed. Count the painted rows and columns to compare native repetition.',
  'background-size': 'The readout reports the computed size, including keywords. The artwork’s visible edges expose the actual fit, crop or distortion.',
}

/** Preserve complete paint prerequisites, contexts and native scroll geometry. */
export function backgrounds(section: ReferenceDemoSection): DemoScene {
  const glyphs = section.page === 'background-clip' && section.id === 'clip-a-background-to-text'
  const scene = typeSpecimens(section, {
    appearance: 'plain', measure: true, caption: captions[section.page],
    properties: glyphs ? ['background-clip', '-webkit-text-fill-color'] : properties[section.page],
  })
  return section.page === 'background-attachment' ? { ...scene, sizing: 'viewport', height: 360, inspect: ['background-attachment'] } : scene
}
