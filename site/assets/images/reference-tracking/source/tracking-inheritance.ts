import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'tracking-inheritance',
  render(theme: Theme) {
    const { text, trackingComparison, scene } = drawing(theme)
    const figure = referenceIllustrations['tracking-inheritance']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS(['font-md', 'font-3xl', 'tracking-widest'])}</style>
      ${text(360, 64, l.parent, 'code', 'center')}
      ${text(360, 96, l.computed, 'note', 'center')}
      ${trackingComparison(360, 152, l.classes, l.sample, l.results)}
      ${text(360, 438, l.scope, 'edge', 'center')}
    `)
  }
}
