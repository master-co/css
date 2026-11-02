import { responsiveIllustration as figure } from '../../../../content/guide/responsive-design/illustration'
import { configuredExampleCSS } from '@master/internal-site/css/configured-example.ts'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Controlled widths are the experiment: real generated @container CSS chooses the tracks at 448px.
export default {
  id: 'local-boundaries',
  render(theme: Theme) {
    const { scene, label, text } = drawing(theme)
    const l = figure.labels
    const css = configuredExampleCSS('', ['container-inline', 'grid-cols(1)', 'grid-cols(2)@container(--md)'])
    const card = (name: string) => `<section>
      ${label(name, 'note')}
      <div class="container-inline"><article class="query-card grid-cols(1) grid-cols(2)@container(--md)">
        <div class="query-copy">${label(l.project, 'note')}${label(l.card, 'body')}</div>
        <div class="query-copy">${label(l.status, 'note')}${label(l.detail, 'body')}</div>
      </article></div>
    </section>`
    return scene(figure.title, figure.alt, `
      <style>${css}
        .query-page { left:32px;top:150px;display:grid;grid-template-columns:448px 160px;gap:16px;padding:16px;border-radius:var(--ui-radius-xl);background:var(--ui-surface-tray);box-shadow:var(--ui-elevation-rise-1); }
        .query-page > section { display:flex;flex-direction:column;gap:14px; }
        .query-card { gap:16px;padding:16px;border-radius:var(--ui-radius-lg);background:var(--ui-surface-sheet);box-shadow:var(--ui-elevation-rise-1); }
        .query-copy { display:flex;flex-direction:column;justify-content:center;gap:8px; }
      </style>
      ${text(360, 51, l.page, 'note', 'center')}
      ${text(360, 82, l.base, 'code', 'center')}
      <div class="query-page">${card(l.main)}${card(l.side)}</div>
      ${text(360, 385, l.query, 'code', 'center')}
      ${text(360, 417, l.rule, 'note', 'center')}
    `)
  }
}
