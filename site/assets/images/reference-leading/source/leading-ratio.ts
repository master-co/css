import { generatePresetCSS } from '../../../../common/generate-preset-css'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

export default {
  id: 'leading-ratio',
  render(theme: Theme) {
    const { text, route, leadingComparison, scene } = drawing(theme)
    const figure = referenceIllustrations['leading-ratio']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS(['leading-md', ...l.classes])}</style>
      ${text(360, 64, l.parent, 'code', 'center')}
      ${text(360, 94, l.ratio, 'note', 'center')}
      ${leadingComparison(360, 168, l.classes, l.sizes, l.lines, l.results)}
      ${text(360, 430, l.scope, 'edge', 'center')}
      ${route('M360 126V140H228V154')}
      ${route('M360 140H492V154')}
    `)
  }
}
