import { compile } from '@tailwindcss/node'

const card = `<article id="card" class="p-card r-lg bg-surface fg-ink grid gap-sm">
<h1 class="m(0) text-xl font-semibold">Account settings</h1>
<label for="name">Display name</label><input id="name" value="Aron" />
<label><input id="updates" type="checkbox" /> Email updates</label>
<div class="flex gap-sm"><button id="save" type="button" class="bg-brand fg-white">Save changes</button><button id="locked" type="button" disabled>Managed by team</button></div>
<output id="status" aria-live="polite">Ready</output></article>`
const base = `@import '@master/css';
@custom-media --md (width >= 52rem);
@theme { --color-brand:#2563eb; --color-information:#2563eb; --color-surface:light-dark(#ffffff,#1f2937); --color-ink:light-dark(#111827,#f9fafb); --spacing-card:1.5rem; }
@layer base {
* { box-sizing:border-box; } html { font:16px/1.5 Arial,sans-serif; color-scheme:light; } html.dark { color-scheme:dark; }
body { margin:0;padding:24px;background:light-dark(#f1f5f9,#111827);color:light-dark(#111827,#f9fafb); }
main { max-width:720px;margin:auto; } button,input { font:inherit; } button { padding:10px 16px;border:0;border-radius:6px;cursor:pointer; }
input:not([type=checkbox]) { min-width:0;width:100%;padding:8px;border:1px solid #94a3b8;border-radius:4px; }
button:focus-visible,input:focus-visible { outline:2px solid #a855f7;outline-offset:3px; } button:disabled { opacity:.5;cursor:not-allowed; }
}
`
const script = `document.querySelector('#save')?.addEventListener('click',()=>document.querySelector('#status').textContent='Saved');
window.setTheme=theme=>document.documentElement.classList.toggle('dark',theme==='dark');
window.setProgress=value=>{ document.querySelector('#fill').className='w('+value+'%)';document.querySelector('#progress').setAttribute('aria-valuenow',String(value)); };
`
const wrap = (html, link = './output.css') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Authoring fixture</title><link rel="stylesheet" href="${link}"></head><body><main>${html}</main><script src="./app.js"></script></body></html>`

/** Starter and oracle controls are kept outside participant workspaces. */
export async function fixture(task, repository, solved = false) {
  let css = base, html = card, js = script, link = './output.css'
  const extras = {}
  let detail = 'Preserve the existing controls, labels, save interaction and native disabled button. Use app.css, index.html and app.js. The setTheme("light"|"dark") API already exists.'
  if (task === 'settings-card') detail += ' At 390px and 1280px, keep the heading at least 16px inside the top and left card edges; inner-panel spacing is allowed.'
  if (task === 'density-edit') detail += ' Reduce the heading inset from 24px to between 8px and 23px, and reduce the card row gap below 12px.'
  if (task === 'settings-card' && !solved) html = card.replace(/class="[^"]*"/g, '')
  if (task === 'density-edit' && solved) html = card.replace('p-card', 'p-md').replace('grid gap-sm', 'grid gap-xs')
  if (task === 'dark-theme') {
    css = css.replace('--color-surface:light-dark(#ffffff,#1f2937)', '--color-surface:#ffffff').replace('--color-ink:light-dark(#111827,#f9fafb)', '--color-ink:#111827')
    if (solved) css += '\n.dark { --color-surface:#1f2937;--color-ink:#f9fafb; }'
  }
  if (task === 'responsive-grid') {
    html = `<section id="cards" class="grid gap-sm ${solved ? 'grid-cols(3)@md' : ''}"><article>One</article><article>Two</article><article>Three</article></section>`
    css += '\n@layer base { #cards>article { background:var(--color-surface);padding:16px;min-height:80px; } }'
  }
  if (task === 'css-declarations') {
    css += '\n@utility flex { display:grid; }'
    html = solved ? '<div id="target" class="(display:flex) items-center p(16) (gap:1rem)"><span>One</span><span>Two</span></div>' : '<div id="target" style="display:flex;align-items:center;padding:16px;gap:1rem"><span>One</span><span>Two</span></div>'
    detail = 'The local utility named flex is intentionally overridden. Preserve the declaration values; remove the target inline style when expressing it as classes. Explain cascade verification limits.'
  }
  if (task === 'fallback-order') {
    html = '<div id="target" style="display:block;display:grid;padding:1rem;padding-left:0">Fallback content</div>'
    if (solved) { html = '<div id="target" class="fallback">Fallback content</div>'; css += '\n.fallback{display:block;display:grid;padding:1rem;padding-left:0}' }
    detail = 'Keep the duplicate declaration fallback and padding override in their authored order, including when leaving them in native CSS. Explain the retained CSS.'
  }
  if (task === 'missing-css' && !solved) link = './missing-output.css'
  if (task === 'token-collision') {
    css += '\n@theme { --font-size-brand:24px;--font-weight-brand:600; }'
    html = `<p id="target" class="${solved ? '(font-size:var(--font-size-brand))' : 'font-brand'}">Brand heading</p><p id="control">Control</p>`
    detail = 'The intended target font size is 24px; keep the control text at its existing 16px and leave weight at 400. Explain which namespaces collide.'
  }
  if (task === 'dynamic-value') {
    html = `<div id="progress" role="progressbar" aria-label="Upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" style="width:200px;background:#ddd"><div id="fill" class="${solved ? '(width:var(--progress))' : '(width:40%)'}" style="height:12px;background:#2563eb;--progress:40%"></div></div>`
    if (solved) js = script.replace('document.querySelector(\'#fill\').className=\'w(\'+value+\'%)\'', 'document.querySelector(\'#fill\').style.setProperty(\'--progress\',value+\'%\')')
    detail = 'Use the existing setProgress(number) API. The track must remain 200px; verify 0, 50 and 100, and keep aria-valuenow synchronized.'
  }
  if (task === 'review-second-change') {
    html = '<button id="primary" class="bg-brand fg-white">Primary</button><button id="secondary" class="bg-brand fg-white">Secondary</button><aside id="information" class="bg-information fg-white">Information</aside>'
    if (solved) css = css.replace('--color-brand:#2563eb', '--color-brand:#7c3aed')
    detail = 'Change --color-brand from #2563eb to #7c3aed. Identify its consumers primary and secondary. Keep information at #2563eb. Describe before/after evidence and limits of static impact analysis.'
  }
  if (task.startsWith('tailwind-')) {
    const candidateHTML = task === 'tailwind-card'
      ? '<article id="card" class="p-6 rounded-lg bg-white text-slate-900 grid gap-3"><h1 class="text-xl font-semibold">Account settings</h1><label for="name">Display name</label><input id="name" value="Aron"><button id="save" class="bg-blue-600 text-white p-3 rounded-lg">Save changes</button><button id="locked" disabled>Managed by team</button><output id="status">Ready</output></article>'
      : '<button id="target" type="button" class="h-10 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">Export</button>'
    const tw = await compile('@import "tailwindcss";', { base: repository, onDependency() {} })
    const sourceCSS = tw.build([...candidateHTML.matchAll(/class="([^"]*)"/g)].flatMap(m => m[1].split(' ')))
    extras['source-tailwind.css'] = sourceCSS
    extras['source.html'] = wrap(candidateHTML, './source-tailwind.css')
    extras['source-tailwind-version.txt'] = 'Built with the installed Tailwind package; exact version is recorded in the experiment protocol. No plugins or tailwind-merge.'
    html = candidateHTML
    link = solved ? './output.css' : './source-tailwind.css'
    css = '@import \'@master/css\';\n'
    if (solved) {
      // Positive control retains source CSS but replaces one utility with a checked native class.
      const from = task === 'tailwind-card' ? 'p-6' : 'h-10'
      const to = task === 'tailwind-card' ? '(padding:calc(var(--spacing)*6))' : '(height:calc(var(--spacing)*10))'
      html = html.replace(from, to)
      css += `\n${sourceCSS}\nbody { line-height:inherit; }`
    }
    detail = 'The supplied source.html and source-tailwind.css are the immutable source baseline. Use the existing Master app.css build, move index.html to output.css, convert straightforward utilities, and retain necessary reset/token/state CSS in app.css. At least one converted class must be a project-registered Master utility with a spelling absent from the original snippet; a native-CSS-only rewrite does not complete this conversion task. Do not redesign or just link the entire original source stylesheet. Explain retained CSS and remaining dependencies.'
  }
  return { files: { 'index.html': wrap(html, link), 'app.css': css, 'app.js': js, ...extras }, detail }
}
