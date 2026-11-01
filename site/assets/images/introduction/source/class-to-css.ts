import { introductionIllustration } from '../../../../content/guide/introduction/illustration'
import { drawing, escapeHtml, type Theme } from '../../rendering-modes/source/materials'

// Reader question: how does a token class connect HTML to a shared CSS value?
// Repeated, exactly attached names establish correspondence, not execution order.
// The complete generated stylesheet beside this image supplies the omitted layer context.
export default {
  id: 'class-to-css',
  render(theme: Theme) {
    const { text, sheet, row, label, icon, leader, scene } = drawing(theme)
    const l = introductionIllustration.labels
    const range = (id: string, value: string, tone: 'blue' | 'violet') => `<span class="code-part" data-tone="${tone}">${label(value, 'code')}<i class="code-bracket" data-anchor="${id}"></i></span>`
    const reference = (id: string, value: string, tone: 'blue' | 'violet') => `<span data-anchor="${id}" data-tone="${tone}" style="color:var(--annotation-ink)">${escapeHtml(value)}</span>`
    return scene(introductionIllustration.title, introductionIllustration.alt, `
      <style>.scene > .routes { z-index: 1; }</style>
      ${sheet(192, 94, undefined, undefined, `
        ${row(icon('code') + label(l.markup))}
        <div class="code" style="margin-top:8px;margin-bottom:9px" data-label>&lt;div class="${range('html-class', l.className, 'blue')}"&gt;</div>
      `, 'center')}
      ${sheet(518, 94, undefined, undefined, `
        ${row(icon('layers') + label(l.theme))}
        <div class="code" style="margin-top:8px;margin-bottom:9px" data-label>${range('theme-token', l.tokenName, 'violet')}: ${escapeHtml(l.tokenValue)};</div>
      `, 'center')}
      ${leader('html-class', 'css-selector', 222, 'blue')}
      ${leader('theme-token', 'css-variable', 222, 'violet')}
      <div class="code anchor-center" style="left:360px;top:278px;line-height:26px" data-label>
        <div>${reference('css-selector', '.' + l.className, 'blue')} {</div>
        <div style="padding-left:18px">padding: var(${reference('css-variable', l.tokenName, 'violet')});</div>
        <div>}</div>
      </div>
      ${text(360, 378, l.output, 'note', 'center')}
    `)
  }
}
