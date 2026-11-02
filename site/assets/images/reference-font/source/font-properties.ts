import { generatePresetCSS } from '../../../../common/generate-preset-css'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

export default {
  id: 'font-properties',
  render(theme: Theme) {
    const { text, fontComparison, scene } = drawing(theme)
    const figure = referenceIllustrations['font-properties']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS([...new Set([l.baseline, ...l.rows.map(row => row.classes)].flatMap(value => value.split(' ')))])}</style>
      ${text(360, 58, l.heading, 'note', 'center')}
      ${text(360, 88, l.baseline, 'code', 'center')}
      ${fontComparison(360, 160, l.baseline, l.headings, l.rows, l.sample)}
      ${text(360, 432, l.scope, 'edge', 'center')}
    `)
  }
}
