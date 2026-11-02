import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Exact range anatomy: a quoted delimiter is value text, not the head boundary.
// Punctuation stays contiguous; the unannotated outer parentheses remain visible.
export default {
  id: 'native-value-boundary',
  render(theme: Theme) {
    const { text, codeParts, annotation, leader, scene } = drawing(theme)
    const figure = referenceIllustrations['native-value-boundary']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 102, l.source, 'note', 'center')}
      ${codeParts(360, 146, [
        { value: '(' },
        { id: 'property', value: 'content', tone: 'blue' },
        { value: ':' },
        { id: 'value', value: "')'", tone: 'violet' },
        { value: ')' },
        { id: 'selector', value: '::before', tone: 'amber' }
      ])}
      ${leader('property', 'property-note', 210, 'blue')}
      ${leader('value', 'value-note', 210, 'violet')}
      ${leader('selector', 'selector-note', 210, 'amber')}
      ${annotation(160, 246, 'property-note', l.property, l.propertyDetail, 'blue')}
      ${annotation(360, 246, 'value-note', l.value, l.valueDetail, 'violet')}
      ${annotation(560, 246, 'selector-note', l.selector, l.selectorDetail, 'amber')}
      ${text(360, 338, l.output, 'code', 'center')}
      ${text(360, 370, l.result, 'edge', 'center')}
    `)
  }
}
