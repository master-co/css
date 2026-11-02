import { materialUIIllustration as figure } from '../../../../content/guide/migration/material-ui/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Aligned equations expose the hidden scale conversion without depicting a redesigned widget.
export default {
  id: 'resolve-sx',
  render(theme: Theme) {
    const { scene, text, sheet, label, route } = drawing(theme)
    const l = figure.labels
    const conversion = (y: number, source: string, value: string, target: string) => `
      ${text(59, y, source, 'code')}${text(360, y, value, 'code', 'center')}${text(610, y, target, 'code', 'center')}
      ${route(`M231 ${y + 10}H260`)}${route(`M455 ${y + 10}H500`)}`
    return scene(figure.title, figure.alt, `
      ${text(59, 67, l.source, 'note')}${text(360, 67, l.value, 'note', 'center')}${text(610, 67, l.target, 'note', 'center')}
      ${conversion(135, l.gap, l.gapMath, l.gapClass)}
      ${conversion(205, l.padding, l.paddingMath, l.paddingClass)}
      ${conversion(275, l.radius, l.radiusMath, l.radiusClass)}
      ${sheet(360, 349, undefined, undefined, label(l.token, 'code'), 'center')}
      ${text(360, 428, l.explicit, 'note', 'center')}
    `)
  }
}
