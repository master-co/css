import { typeIllustration as figure } from '../../../../content/guide/typography/illustration'
import { configuredExampleCSS } from '@master/internal-site/css/configured-example.ts'
import { drawing, escapeHtml, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Real generated typography controls each line box. Explicit line breaks isolate leading and tracking from wrapping.
export default {
  id: 'line-rhythm',
  render(theme: Theme) {
    const { scene, label, text } = drawing(theme)
    const l = figure.labels
    const css = configuredExampleCSS('', [l.font, l.text, 'leading-md', 'tracking-normal'])
    const sample = (name: string) => `<div class="type-case leading-md tracking-normal">
      ${label(name, 'code')}
      <div class="type-lines ${name}"><span data-label>${escapeHtml(l.first)}</span><span data-label>${escapeHtml(l.second)}</span></div>
    </div>`
    return scene(figure.title, figure.alt, `
      <style>${css}
        .type-study { left:50%;top:135px;translate:-50% 0;display:grid;grid-template-columns:max-content max-content;gap:32px 82px;width:max-content; }
        .type-case { display:flex;flex-direction:column;gap:24px; }
        .type-lines { font-family:Geist,sans-serif;font-weight:400;color:var(--ui-text-strong); }
        .type-lines > span { display:block;background:linear-gradient(to top,var(--ui-line-divider) 1px,transparent 1px); }
      </style>
      ${text(360, 62, l.shared, 'note', 'center')}
      <div class="type-study">${sample(l.font)}${sample(l.text)}${label(l.inherited, 'note')}${label(l.treatment, 'note')}</div>
      ${text(360, 393, l.parent, 'code', 'center')}
    `)
  }
}
