import { themeIllustration as figure } from '../../../../content/guide/theme/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// A controlled comparison. Real CSS padding and gap carry the quantitative claim;
// intrinsic layout, identical text, and aligned centers keep the token edit the only changing variable.
export default {
  id: 'shared-spacing',
  render(theme: Theme) {
    const { scene, label } = drawing(theme)
    const l = figure.labels
    const column = (padding: number, state: string, value: string) => `
      <div class="token-case" style="--measure:${padding}px">
        <div class="token-case-heading">${label(state, 'eyebrow')}${label(value, 'code')}</div>
        <div class="token-padding"><span class="body" data-label>${l.card}</span><i></i></div>
        <div class="token-gap"><span class="token-item" data-label>${l.first}</span><i></i><span class="token-item" data-label>${l.second}</span></div>
      </div>`
    return scene(figure.title, figure.alt, `
      <style>
        .token-study { left:50%;top:50%;translate:-50% -50%;display:grid;grid-template-columns:max-content max-content max-content;column-gap:56px;row-gap:34px;align-items:center; }
        .token-study-heading { grid-column:1/-1;justify-self:center;display:flex;align-items:center;gap:12px; }
        .token-study-heading .code { color:var(--ui-text-strong); }
        .token-row-labels { display:grid;grid-template-rows:45px 110px 74px;row-gap:28px;align-items:center; }
        .token-case { display:grid;grid-template-rows:45px 110px 74px;row-gap:28px;justify-items:center;align-items:center; }
        .token-case-heading { display:flex;flex-direction:column;align-items:center;gap:7px; }
        .token-padding { position:relative;padding:var(--measure);border-radius:var(--ui-radius-md);background:color-mix(in oklch,var(--ui-tone-blue) 8%,var(--ui-surface-sheet));box-shadow:var(--ui-elevation-rise-1); }
        .token-padding .body { display:block;background:var(--ui-surface-sheet);outline:1px dotted var(--ui-tone-blue); }
        .token-padding i { position:absolute;left:0;top:50%;width:var(--measure);height:7px;border-inline:1px solid var(--ui-tone-blue); }
        .token-padding i::after { content:'';position:absolute;inset-inline:0;top:3px;border-top:1px solid var(--ui-tone-blue); }
        .token-gap { display:grid;grid-template-columns:max-content var(--measure) max-content;align-items:center; }
        .token-item { padding:7px 10px;border-radius:var(--ui-radius-md);background:var(--ui-surface-sheet);box-shadow:var(--ui-elevation-rise-1); }
        .token-gap i { position:relative;height:34px;background:color-mix(in oklch,var(--ui-tone-blue) 8%,transparent);border-inline:1px dotted var(--ui-tone-blue); }
        .token-gap i::after { content:'';position:absolute;inset-inline:0;top:50%;border-top:1px solid var(--ui-tone-blue); }
        .token-study-footer { grid-column:1/-1;justify-self:center; }
      </style>
      <div class="token-study">
        <div class="token-study-heading">${label(l.token, 'code')}</div>
        <div class="token-row-labels"><span></span>${label(l.padding, 'code')}${label(l.gap, 'code')}</div>
        ${column(24, l.before, l.oldValue)}
        ${column(32, l.after, l.newValue)}
        <div class="token-study-footer">${label(l.unchanged, 'note')}</div>
      </div>
    `)
  }
}
