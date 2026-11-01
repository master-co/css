import { packageIllustration as figure } from '../../../../content/guide/authoring-packages/illustration'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// A source graph followed by two build outcomes; no package-wide pre-generated utility bundle.
export default {
  id: 'consumer-output',
  render(theme: Theme) {
    const { scene, sheet, label, row, icon, rule, text, route } = drawing(theme)
    const l = figure.labels
    const consumer = (x: number, name: string, usage: string, utility: boolean) => sheet(x, 266, undefined, undefined, `
      ${row(icon('window') + label(name))}
      ${label(usage, 'code')}${rule}
      ${label(l.output, 'note')}
      ${label(l.native, 'code')}
      ${utility ? label(l.rule, 'code') : ''}
    `, 'center')
    return scene(figure.title, figure.alt, `
      ${text(360, 34, l.shared, 'note', 'center')}
      ${sheet(360, 66, undefined, undefined, `
        ${row(icon('fileCode') + label(l.source))}${rule}
        ${label(l.native, 'code')}${label(l.utility, 'code')}
      `, 'center')}
      ${route('M360 187V219', { arrow: false })}
      ${route('M190 219H530', { arrow: false })}
      ${route('M190 219V248')}${route('M530 219V248')}
      ${consumer(190, l.a, l.useA, false)}
      ${consumer(530, l.b, l.useB, true)}
      ${text(360, 447, l.build, 'note', 'center')}
    `)
  }
}
