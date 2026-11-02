import { languageIllustration as figure } from '../../../../content/guide/language-service/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// One real token follows a project-context link into two successive editor states.
// Editor chrome is reduced to the class attribute, completion and hover being taught.
export default {
  id: 'project-completion',
  render(theme: Theme) {
    const { scene, sheet, row, icon, label, text, route, rule } = drawing(theme)
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>
        .editor-fragment { display:flex; flex-direction:column; align-items:flex-start; gap:12px; }
        .editor-fragment .sheet { position:static; }
        .editor-choice { display:flex; gap:48px; align-items:center; padding:7px 10px; margin:4px -6px -4px; border-radius:var(--ui-radius-sm); background:color-mix(in oklch,var(--ui-tone-blue) 9%,transparent); }
        .editor-choice .code { color:var(--ui-tone-blue); }
        .editor-caret { border-right:1px solid var(--ui-text-strong); padding-right:1px; }
      </style>
      ${sheet(48, 173, undefined, undefined, `
        ${row(icon('fileCode') + label(l.source))}${rule}
        ${label("@import '@master/css';", 'code')}
        ${label('@theme {', 'code')}
        <div style="padding-left:16px">${label(l.token, 'code')}</div>
        ${label('}', 'code')}
      `)}
      ${text(174, 139, l.context, 'eyebrow', 'center')}
      ${route('M302 247H339V147H369')}
      <div class="editor-fragment" style="left:390px;top:83px">
        ${label(l.completion)}
        <div class="code" data-label>&lt;article class="<span class="editor-caret">${l.prefix}</span>"&gt;</div>
        <div class="sheet">
          <div class="editor-choice">${label(l.className, 'code')}${label('project token', 'edge')}</div>
        </div>
      </div>
      ${route('M510 225V265')}
      <div class="editor-fragment" style="left:390px;top:286px">
        ${label(l.hover)}
        <div class="sheet">
          ${label('.p-card {', 'code')}
          <div style="padding-left:12px">${label(l.declaration, 'code')}</div>
          ${label('}', 'code')}
        </div>
      </div>
      ${text(390, 428, l.note, 'edge')}
    `)
  }
}
