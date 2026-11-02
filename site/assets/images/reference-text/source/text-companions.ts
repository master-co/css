import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'text-companions',
  render(theme: Theme) {
    const { text, route, scene } = drawing(theme)
    const figure = referenceIllustrations['text-companions']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 60, figure.source, 'code', 'center')}
      ${text(118, 238, l.class, 'code', 'center')}
      ${l.properties.map((property, index) => `${text(306, 128 + index * 110, property, 'title')}${text(306, 158 + index * 110, l.values[index], 'code')}`).join('')}
      ${text(360, 438, l.scope, 'edge', 'center')}
      ${route('M166 248H216V138H292')}
      ${route('M216 248H292')}
      ${route('M216 248V358H292')}
    `)
  }
}
