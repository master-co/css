import { syntaxIllustration } from '../../../../content/guide/syntax-tutorial/illustration'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Teach the exact ranges inside one class. The adjacent prose and generated CSS explain when the combined rule applies.
// Keep the source contiguous so annotation colours and leaders cannot imply extra spaces, classes or execution steps.
export default {
  id: 'class-anatomy',
  render(theme: Theme) {
    const { text, codeParts, annotation, leader, scene } = drawing(theme)
    const l = syntaxIllustration.labels
    return scene(syntaxIllustration.title, syntaxIllustration.alt, `
      ${text(360, 136, l.source, 'note', 'center')}
      ${codeParts(360, 180, [
        { id: 'style-range', value: l.styleCode, tone: 'blue' },
        { id: 'selector-range', value: l.selectorCode, tone: 'violet' },
        { id: 'condition-range', value: l.conditionCode, tone: 'amber' }
      ])}
      ${leader('style-range', 'style-note', 240, 'blue')}
      ${leader('selector-range', 'selector-note', 240, 'violet')}
      ${leader('condition-range', 'condition-note', 240, 'amber')}
      ${annotation(160, 276, 'style-note', l.style, l.styleResult, 'blue')}
      ${annotation(360, 276, 'selector-note', l.selector, l.selectorResult, 'violet')}
      ${annotation(560, 276, 'condition-note', l.condition, l.conditionResult, 'amber')}
    `)
  }
}
