import { installationIllustration } from '../../../../content/guide/installation/(main)/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Reader question: what needs to be connected after package installation?
// The two real inputs merge at the build integration; only CSS travels to the page.
// Content-sized flex rows keep every connector attached as labels and artifacts change size.
// Framework-specific imports and follow-up commands remain in the adjacent prose.
export default {
  id: 'setup-flow',
  render(theme: Theme) {
    const { sheet, row, label, icon, scene } = drawing(theme)
    const l = installationIllustration.labels
    const arrow = (caption = '') => `<div class="setup-arrow">${caption ? label(caption, 'edge') : ''}<svg viewBox="0 0 48 8" width="48" height="8"><path d="M0 4H46m-4-3 4 3-4 3"/></svg></div>`
    return scene(installationIllustration.title, installationIllustration.alt, `
      <style>
        .setup-flow { display: flex; align-items: center; left: 50%; top: 50%; translate: -50% -50%; width: max-content; }
        .setup-inputs { display: flex; flex-direction: column; gap: 64px; }
        .setup-input { position: relative; display: flex; align-items: center; justify-content: flex-end; }
        .setup-input::after { content: ''; width: 28px; border-top: 1px solid var(--ui-text-disabled); }
        .setup-input::before { content: ''; position: absolute; right: 0; border-right: 1px solid var(--ui-text-disabled); }
        .setup-input:first-child::before { top: 50%; bottom: -32px; }
        .setup-input:last-child::before { top: -32px; bottom: 50%; }
        .setup-input .sheet { position: static; }
        .setup-flow .chip { position: static; width: max-content; }
        .setup-arrow { position: relative; display: flex; align-items: center; }
        .setup-arrow > .edge { position: absolute; left: 50%; bottom: 12px; translate: -50% 0; }
        .setup-arrow path { fill: none; stroke: var(--ui-text-disabled); stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
        .setup-page { position: relative; }
        .setup-page > .title { position: absolute; left: 50%; bottom: calc(100% + 14px); translate: -50% 0; }
        .setup-page .window { position: relative; width: max-content; }
        .setup-result { padding: 16px; }
        .setup-result .body { color: var(--ui-text-strong); font-size: 14px; line-height: 21px; }
      </style>
      <div class="setup-flow">
        <div class="setup-inputs">
          <div class="setup-input">${sheet(0, 0, undefined, undefined, row(icon('code') + label(l.markup)) + label(l.className, 'code'))}</div>
          <div class="setup-input">${sheet(0, 0, undefined, undefined, row(icon('fileCode') + label(l.stylesheet)) + label(l.import, 'code'))}</div>
        </div>
        ${arrow()}
        <div class="chip">${icon('layers')}${label(l.integration)}</div>
        ${arrow(l.css)}
        <div class="setup-page">
          ${label(l.page)}
          <div class="window">
            <div class="toolbar"><i></i><i></i><i></i></div>
            <div class="setup-result">${label(l.result, 'body')}</div>
          </div>
        </div>
      </div>
    `)
  }
}
