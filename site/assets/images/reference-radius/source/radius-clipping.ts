import { generatePresetCSS } from '../../../../common/generate-preset-css'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Same real parent radius and child content; only native overflow clipping changes.
export default {
  id: 'radius-clipping',
  render(theme: Theme) {
    const { text, radiusSpecimen, scene } = drawing(theme)
    const figure = referenceIllustrations['radius-clipping']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS(['r-4xl', 'overflow-hidden'])}</style>
      ${text(360, 80, l.shared, 'note', 'center')}
      ${text(196, 158, l.left, 'code', 'center')}
      ${text(524, 158, l.right, 'code', 'center')}
      ${radiusSpecimen(196, 216, false, l.child, l.parent)}
      ${radiusSpecimen(524, 216, true, l.child, l.parent)}
      ${text(196, 372, l.visible, 'edge', 'center')}
      ${text(524, 372, l.clipped, 'edge', 'center')}
      ${text(360, 434, l.scope, 'edge', 'center')}
    `)
  }
}
