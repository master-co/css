import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Reader question: how do two query suffixes constrain one rule?
// Exact nested CSS, braces and scope guides establish containment even without colour.
// The utilities layer is explicitly omitted; no arrows imply a browser execution sequence.
export default {
  id: 'nested-conditions',
  render(theme: Theme) {
    const { text, codeParts, annotation, leader, sheet, label, codeScope, scene } = drawing(theme)
    const figure = referenceIllustrations['nested-conditions']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 46, l.source, 'note', 'center')}
      ${codeParts(360, 78, [
        { value: 'grid' },
        { id: 'media', value: l.media, tone: 'blue' },
        { id: 'supports', value: l.supports, tone: 'violet' }
      ])}
      ${leader('media', 'media-note', 128, 'blue')}
      ${leader('supports', 'supports-note', 128, 'violet')}
      ${annotation(240, 150, 'media-note', l.mediaLabel, l.mediaDetail, 'blue')}
      ${annotation(475, 150, 'supports-note', l.supportsLabel, l.supportsDetail, 'violet')}
      ${text(360, 222, l.output, 'note', 'center')}
      ${sheet(360, 254, undefined, undefined,
        codeScope(l.mediaRule,
          codeScope(l.supportsRule,
            codeScope(l.selector, label(l.declaration, 'code')), 'violet'), 'blue'), 'center')}
    `)
  }
}
