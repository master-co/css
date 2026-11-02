import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Controlled comparison: same DOM, link text, intrinsic sizing and hovered first link.
// The changed state attachment changes which links actually gain an underline.
export default {
  id: 'selector-targets',
  render(theme: Theme) {
    const { text, selectorSpecimen, scene } = drawing(theme)
    const figure = referenceIllustrations['selector-targets']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 78, l.invariant, 'note', 'center')}
      ${text(200, 138, l.ownerClass, 'code', 'center')}
      ${text(520, 138, l.targetClass, 'code', 'center')}
      ${text(200, 170, l.ownerTest, 'edge', 'center')}
      ${text(520, 170, l.targetTest, 'edge', 'center')}
      ${selectorSpecimen(200, 222, 'owner', l.article, l.firstLink, l.secondLink)}
      ${selectorSpecimen(520, 222, 'target', l.article, l.firstLink, l.secondLink)}
      ${text(200, 382, l.ownerResult, 'note', 'center')}
      ${text(520, 382, l.targetResult, 'note', 'center')}
    `)
  }
}
