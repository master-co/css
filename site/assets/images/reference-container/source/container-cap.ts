import { generatePresetCSS } from '../../../../common/generate-preset-css'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// An actual max-width meets two measured containing blocks. Widths share a scale;
// natural content sets both heights, so the changed width is the only comparison.
export default {
  id: 'container-cap',
  render(theme: Theme) {
    const { text, sizingSpecimen, scene } = drawing(theme)
    const figure = referenceIllustrations['container-cap']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS([l.class])}</style>
      ${text(360, 60, l.class, 'code', 'center')}
      ${text(360, 102, l.declaration, 'code', 'center')}
      ${sizingSpecimen(200, 174, figure.widths.wide, l.wide, l.content, l.capped)}
      ${sizingSpecimen(200, 304, figure.widths.narrow, l.narrow, l.content, l.fitted)}
      ${text(360, 436, l.scope, 'edge', 'center')}
    `)
  }
}
