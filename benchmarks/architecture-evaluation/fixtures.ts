export const arms = ['native-css', 'tailwind', 'master-cli', 'master-mcp'] as const
export type Arm = typeof arms[number]

export const tasks = [
  { id: 'token-migration', prompt: 'Rename the shared brand color token to accent, change it from #2563eb to #7c3aed, and update both brand surfaces. Remove the old token. Preserve the independently named information token and its surface at #2563eb, even though its initial value matches brand. Keep the neutral surface unchanged.' },
  { id: 'responsive-layout', prompt: 'Change the cards grid to two equal columns from 768px onward and one column below 768px. Keep the independent control grid at three columns.' },
  { id: 'scoped-hover', prompt: 'Make the danger button background #dc2626 only while hovered. Its resting color and the secondary button in both states must remain #2563eb.' },
  { id: 'dynamic-value', prompt: 'Make the progress fill follow the existing setProgress(number) API for arbitrary percentages, clamped to 0–100%. Keep the track 200px wide. Use CSS variables for the value; do not add a runtime CSS compiler or enumerate values.' },
  { id: 'source-discovery', prompt: 'Extend the existing setTone(tone) API with warning: a #fef3c7 background and #78350f text. Keep neutral styling and support switching back. Ensure production CSS includes the required styles; do not compile CSS in the browser.' },
  { id: 'reduced-motion', prompt: 'Disable the pulse animation when prefers-reduced-motion is reduce. Keep the pulse animation named pulse when motion is allowed, and leave the independent control animation named spin in both modes.' }
] as const
export type TaskId = typeof tasks[number]['id']

/** Solutions are harness controls, never included in a participant workspace. */
export function fixture(arm: Arm, task: TaskId, solved = false) {
  const native = arm === 'native-css'
  const tailwind = arm === 'tailwind'
  const done = (id: TaskId) => solved && task === id
  const color = done('token-migration') ? '#7c3aed' : '#2563eb'
  const token = done('token-migration') ? 'accent' : 'brand'
  const names = {
    brand: native ? 'brand' : `bg-${token}`,
    information: native ? 'information' : 'bg-information',
    cards: native ? 'cards' : tailwind
      ? `grid grid-cols-1 ${done('responsive-layout') ? 'min-[768px]:grid-cols-2' : 'min-[1024px]:grid-cols-3'}`
      : `display:grid grid-template-columns:repeat(1,minmax(0,1fr)) ${done('responsive-layout') ? 'grid-template-columns:repeat(2,minmax(0,1fr))@media((width>=768px))' : 'grid-template-columns:repeat(3,minmax(0,1fr))@media((width>=1024px))'}`,
    danger: native ? 'danger' : tailwind
      ? `bg-[#2563eb] ${done('scoped-hover') ? 'hover:bg-[#dc2626]' : ''}`
      : `background-color:#2563eb ${done('scoped-hover') ? 'background-color:#dc2626:hover' : ''}`,
    fill: native ? 'fill' : tailwind
      ? done('dynamic-value') ? 'w-[clamp(0%,var(--progress),100%)]' : 'w-[40%]'
      : done('dynamic-value') ? 'width:clamp(0%,var(--progress),100%)' : 'width:40%',
    pulse: native ? 'pulse' : tailwind
      ? `animate-[pulse_2s_linear_infinite] ${done('reduced-motion') ? 'motion-reduce:animate-none' : ''}`
      : `animation:pulse|2s|linear|infinite ${done('reduced-motion') ? 'animation:none@motion-reduce' : ''}`,
    neutral: native ? 'neutral' : tailwind ? 'bg-[#e5e7eb] text-[#111827]' : 'background-color:#e5e7eb color:#111827',
    warning: native ? 'warning' : tailwind ? 'bg-[#fef3c7] text-[#78350f]' : 'background-color:#fef3c7 color:#78350f'
  }
  const common = `
* { box-sizing: border-box; }
html { font-size: 16px; }
body { margin: 0; padding: 24px; font: 16px/1.5 sans-serif; color: #111827; background: white; }
section { margin: 0 0 16px; }
[data-brand], [data-information], [data-neutral], button, #badge { padding: 12px; border: 0; border-radius: 4px; }
[data-brand], [data-information], button { color: white; }
[data-neutral] { background: #e5e7eb; }
#cards, #control-grid { gap: 8px; }
#cards > *, #control-grid > * { min-height: 24px; background: #e5e7eb; }
#control-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); }
#secondary { background: #2563eb; }
#track { width: 200px; height: 12px; background: #e5e7eb; }
#fill { height: 12px; background: #2563eb; }
#pulse, #spin { width: 24px; height: 24px; background: #2563eb; }
#spin { animation: spin 2s linear infinite; }
@keyframes pulse { from { opacity: .5; } to { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }
`
  const nativeStyles = native ? `
:root { --color-${token}: ${color}; --color-information: #2563eb; }
.brand { background: var(--color-${token}); }
.information { background: var(--color-information); }
.cards { display: grid; grid-template-columns: 1fr; }
@media (min-width: ${done('responsive-layout') ? 768 : 1024}px) { .cards { grid-template-columns: repeat(${done('responsive-layout') ? 2 : 3},minmax(0,1fr)); } }
.danger { background: #2563eb; }
${done('scoped-hover') ? '.danger:hover { background: #dc2626; }' : ''}
.fill { width: ${done('dynamic-value') ? 'clamp(0%,var(--progress),100%)' : '40%'}; }
.neutral { background: #e5e7eb; color: #111827; }
${done('source-discovery') ? '.warning { background: #fef3c7; color: #78350f; }' : ''}
.pulse { animation: pulse 2s linear infinite; }
${done('reduced-motion') ? '@media (prefers-reduced-motion:reduce) { .pulse { animation: none; } }' : ''}
` : ''
  const inputCSS = native ? common + nativeStyles
    : `@import "${tailwind ? 'tailwindcss' : '@master/css'}";\n@source "./index.html";\n@source "./app.js";\n@theme { --color-${token}: ${color}; --color-information: #2563eb; }\n${common}`
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Second change fixture</title><link rel="stylesheet" href="./output.css"></head>
<body>
<section><div data-brand class="${names.brand}">Brand panel</div><div data-brand class="${names.brand}">Brand card</div><div data-information class="${names.information}">Information control</div><div data-neutral>Neutral control</div></section>
<section id="cards" class="${names.cards}"><div>One</div><div>Two</div><div>Three</div></section>
<section id="control-grid"><div>A</div><div>B</div><div>C</div></section>
<section><button id="danger" class="${names.danger}">Delete</button><button id="secondary">Cancel</button></section>
<section id="track"><div id="fill" class="${names.fill}" style="--progress:40%"></div></section>
<section><span id="badge" class="${names.neutral}">Status</span></section>
<section><div id="pulse" class="${names.pulse}"></div><div id="spin"></div></section>
<p id="copy">Plain copy: not-a-style bg-definitely-not-a-token</p>
<script src="./app.js"></script></body></html>`
  const script = `const tones = ${JSON.stringify({ neutral: names.neutral, ...(done('source-discovery') ? { warning: names.warning } : {}) }, null, 2)};
window.setTone = tone => { document.querySelector('#badge').className = tones[tone] || tones.neutral; };
window.setProgress = value => { document.querySelector('#fill').style.setProperty('--progress', value + '%'); };
`
  return { 'index.html': html, 'input.css': inputCSS, 'app.js': script }
}
