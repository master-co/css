import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Mapping, not a pipeline: each row repeats the key while preserving a different
// namespace. The arrows bind a class to its token and property, never to another row.
export default {
  id: 'namespace-lookup',
  render(theme: Theme) {
    const { text, codeParts, route, scene } = drawing(theme)
    const figure = referenceIllustrations['namespace-lookup']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 58, l.note, 'note', 'center')}
      ${text(126, 118, l.class, 'title', 'center')}
      ${text(355, 118, l.token, 'title', 'center')}
      ${text(580, 118, l.property, 'title', 'center')}
      ${l.prefixes.map((prefix, index) => {
        const y = 172 + index * 78
        return `
          ${codeParts(126, y, [{ value: prefix }, { id: `class-${index}`, value: l.key, tone: 'blue' }])}
          ${route(`M190 ${y + 14}H248`, { emphasis: true })}
          ${codeParts(355, y, [{ value: l.namespaces[index] }, { id: `token-${index}`, value: l.key, tone: 'blue' }])}
          ${route(`M462 ${y + 14}H512`, { emphasis: true })}
          ${text(580, y + 4, l.properties[index], 'code', 'center')}
        `
      }).join('')}
      ${text(360, 410, l.qualifier, 'edge', 'center')}
    `)
  }
}
