import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Actual names connect context, authored rule and output resources. Output shows excerpts,
// not a complete stylesheet; intrinsic artifact heights follow their different contents.
export default {
  id: 'route',
  render(theme: Theme) {
    const { row, label, icon, sheet, mark, text, route, scene, rule } = drawing(theme)
    const l = deliveryIllustrations.route.labels
    const native = `${label(l.native, 'code')}<div style="padding-left:12px">${label(l.declaration, 'code')}</div>${label(l.close, 'code')}`
    return scene(deliveryFlow('route').title, deliveryFlowDescription('route'), `
      ${sheet(174, 63, undefined, undefined, row(icon('layers') + label(l.project)) + rule + label(l.definitions, 'code'), 'center')}
      ${route('M174 158V224', { dashed: true })}
      ${text(190, 180, l.context, 'edge')}
      ${sheet(174, 245, undefined, undefined, row(icon('fileCode') + label(l.route)) + rule + native, 'center')}
      ${route('M320 306H403')}
      ${text(361, 280, l.compile, 'edge', 'center')}
      ${sheet(554, 174, undefined, undefined, `
        ${row(icon('file') + label(l.output))}${rule}
        ${label(l.resources, 'edge')}${label(l.outputDefinition, 'code')}
        <div style="margin-top:12px">${label(l.rule, 'edge')}</div>
        ${label(l.outputNative, 'code')}<div style="padding-left:12px">${label(l.outputDeclaration, 'code')}</div>${label(l.outputClose, 'code')}
      `, 'center')}
      ${route('M554 384V423')}
      ${text(540, 397, l.load, 'edge', 'end')}
      ${mark(554, 439, 'window', l.page, 'center')}
    `)
  }
}
