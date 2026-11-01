import { monorepoIllustration as figure } from '../../../../content/guide/monorepo/illustration'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Two app boundaries, one imported source. Literal swatches show the actual per-project override.
export default {
  id: 'project-contexts',
  render(theme: Theme) {
    const { scene, sheet, label, text, route, row, rule, icon } = drawing(theme)
    const l = figure.labels
    const app = (x: number, name: string, color: string) => sheet(x, 222, undefined, undefined, `
      ${row(icon('window') + label(name))}${rule}
      ${label(l.entry, 'note')}${label(`${l.token}: ${color}`, 'code')}${rule}
      ${label(l.output, 'note')}
      <div class="app-swatch"><i style="background:${color}"></i>${label(l.usage, 'code')}</div>
    `, 'center')
    return scene(figure.title, figure.alt, `
      <style>.app-swatch{display:flex;align-items:center;gap:10px;margin-top:5px}.app-swatch i{width:18px;height:18px;border-radius:4px;box-shadow:inset 0 0 0 1px #ffffff26}</style>
      ${sheet(360, 52, undefined, undefined, `${row(icon('fileCode') + label(l.source))}${rule}${label(l.shared, 'code')}`, 'center')}
      ${route('M360 145V176', { arrow: false })}${route('M190 176H530', { arrow: false })}
      ${route('M190 176V204')}${route('M530 176V204')}
      ${app(190, l.admin, l.adminValue)}${app(530, l.shop, l.shopValue)}
      ${text(360, 432, l.independence, 'note', 'center')}
    `)
  }
}
