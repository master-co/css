import { colorIllustration as figure } from '../../../../content/guide/colors/illustration'
import { configuredExampleCSS } from '../../../../reference/configured-example'
import { drawing, escapeHtml, type Theme } from '../../rendering-modes/source/materials'

// Actual preset output paints both local schemes; color change is the lesson, not a decorative accent.
export default {
  id: 'local-roles',
  render(theme: Theme) {
    const { scene, label, text } = drawing(theme)
    const l = figure.labels
    const css = configuredExampleCSS('', [l.surface, l.line, l.strong, l.muted])
    const region = (mode: Theme, title: string) => `<div class="role-case">
      ${label(title, 'note')}
      <div class="role-surface ${l.surface} ${l.line}" style="color-scheme:${mode}">
        <span class="role-heading ${l.strong}" data-label>${escapeHtml(l.title)}</span>
        <span class="role-copy ${l.muted}" data-label>${escapeHtml(l.body)}</span>
      </div>
    </div>`
    return scene(figure.title, figure.alt, `
      <style>${css}
        .role-study { left:50%;top:114px;translate:-50% 0;display:flex;gap:40px;width:max-content; }
        .role-case { display:flex;flex-direction:column;gap:18px; }
        .role-surface { display:flex;flex-direction:column;gap:8px;padding:20px;border-width:1px;border-style:solid;border-radius:var(--ui-radius-lg); }
        .role-heading { font:400 18px/1.5 Geist,sans-serif; }
        .role-copy { font:400 14px/1.5 Geist,sans-serif;max-width:220px; }
        .role-vocabulary { left:50%;top:300px;translate:-50% 0;display:grid;grid-template-columns:max-content max-content;gap:12px 48px; }
      </style>
      <div class="role-study">${region('light', l.light)}${region('dark', l.dark)}</div>
      <div class="role-vocabulary">${label(l.surface, 'code')}${label(l.strong, 'code')}${label(l.line, 'code')}${label(l.muted, 'code')}</div>
      ${text(360, 387, l.same, 'note', 'center')}
    `)
  }
}
