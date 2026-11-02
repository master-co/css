import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Shadow paint changes; all intrinsic box geometry and following flow stay identical.
export default {
  id: 'shadow-footprint',
  render(theme: Theme) {
    const { text, shadowSpecimen, scene } = drawing(theme)
    const figure = referenceIllustrations['shadow-footprint']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS([l.left, l.right])}</style>
      ${text(360, 80, l.shared, 'note', 'center')}
      ${text(188, 154, l.left, 'code', 'center')}
      ${text(500, 154, l.right, 'code', 'center')}
      ${shadowSpecimen(188, 218, l.left, l.title, l.content, l.next, l.gap)}
      ${shadowSpecimen(500, 218, l.right, l.title, l.content, l.next, l.gap)}
      ${text(360, 430, l.scope, 'edge', 'center')}
    `)
  }
}
