import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Literal one-rem distances are visible in different regions of matched content.
// Color is inspection notation; no dimensions are invented to fit text into boxes.
export default {
  id: 'spacing-boundaries',
  render(theme: Theme) {
    const { text, route, spacingSpecimen, scene } = drawing(theme)
    const figure = referenceIllustrations['spacing-boundaries']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS(['grid', 'p-md', 'gap-md'])}</style>
      ${text(360, 72, l.token, 'code', 'center')}
      ${route('M360 108V126Q360 134 352 134H212Q204 134 204 142V160', { emphasis: true })}
      ${route('M360 108V126Q360 134 368 134H508Q516 134 516 142V160', { emphasis: true })}
      ${text(204, 178, l.padding, 'code', 'center')}
      ${text(516, 178, l.gap, 'code', 'center')}
      ${spacingSpecimen(204, 232, 'padding', l.first, l.second)}
      ${spacingSpecimen(516, 232, 'gap', l.first, l.second)}
      ${text(204, 374, l.inside, 'note', 'center')}
      ${text(516, 374, l.between, 'note', 'center')}
      ${text(360, 434, l.distinction, 'edge', 'center')}
    `)
  }
}
