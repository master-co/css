import Demo from './Demo'
import DemoViewport from './DemoViewport'
import { demoDocument } from './reference/document'
import { typeSpecimens } from './reference/type-specimens'
import type { DemoScene, ReferenceDemoSection } from './reference/types'

const section = (id: string, title: string): ReferenceDemoSection => ({ page: 'foundations', id, title, html: [], css: '', classes: [], classLists: [], highlighted: [] })

function Specimen({ name, title, scene }: { name: string, title: string, scene: DemoScene }) {
  return <Demo title={title} padding="none" background="plain" data-foundation-type-motion={name} caption={scene.caption}>
    <DemoViewport title={title} document={demoDocument(section(name, title), scene)} sizing={scene.sizing ?? 'content'} height={scene.height} motion={scene.motion} />
  </Demo>
}

export function FoundationTypography() {
  return <Specimen name="type-hierarchy" title="A readable type hierarchy" scene={{ html: "<article class=\"p-md r-sm border-width:1px border-style:solid b-line-divider bg-surface-raised fg-text-body\">\n<p class=\"margin:0 text-xs font-medium fg-text-blue\">Field notes / 024</p>\n<h2 class=\"mt-xs mb-sm text-2xl font-semibold fg-text-strong\">Make room for the details.</h2>\n<p class=\"margin:0 text-sm\">A consistent type scale helps readers move from the main idea to the supporting detail.</p>\n<p class=\"mt-md margin-bottom:0 font-mono font-xs fg-text-muted\">4 min read · Updated today</p>\n</article>", caption: 'Size, weight and color establish hierarchy. The full body copy stays visible at every preview width.' }} />
}

export function FoundationTypeComparison() {
  const authored = { ...section('type-comparison', 'Font size and text scale'), page: 'text-size', html: [
    "<!-- font-3xl · inherited leading and tracking -->\n<div class=\"leading-md tracking-normal\"><p id=\"target\" class=\"margin:0 font-3xl font-regular\">Designing for a clearer reading experience.</p></div>",
    "<!-- text-3xl · size, leading and tracking -->\n<div class=\"leading-md tracking-normal\"><p id=\"target\" class=\"margin:0 text-3xl font-regular\">Designing for a clearer reading experience.</p></div>",
  ] }
  return <Specimen name="type-comparison" title="One size, two type treatments" scene={typeSpecimens(authored, { properties: ['font-size', 'line-height', 'letter-spacing'], appearance: 'plain', caption: 'Both specimens have the same font size and content. font-3xl inherits the parent’s leading and tracking; text-3xl sets all three properties.' })} />
}

export function FoundationMotion() {
  return <Specimen name="finite-motion" title="Two finite entrances" scene={{ motion: true, html: "<div class=\"display:grid gap-lg\">\n<p class=\"margin:0 text-sm fg-text-muted display:none@motion-reduce display:none@media(print)\">Press Play to reveal the two cards.</p>\n<section><p class=\"mb-sm text-sm font-medium\">Fade · 300ms</p><div data-ui=\"surface\"><div id=\"fade\" class=\"p-md r-sm bg-surface-raised border-width:1px border-style:solid b-line-divider animation-name:fade@media(screen)@motion-safe animation-duration:var(--duration-slow)@media(screen)@motion-safe animation-timing-function:var(--easing-smooth)@media(screen)@motion-safe\"><strong class=\"fg-text-strong\">Collection saved</strong><p class=\"mt-xs margin-bottom:0 fg-text-muted\">A quiet opacity entrance.</p></div></div><p class=\"mt-xs margin-bottom:0\" data-ui=\"label\"><output data-animation-readout=\"fade\">Paused</output></p></section>\n<section><p class=\"mb-sm text-sm font-medium\">Zoom · 150ms</p><div data-ui=\"surface\"><div id=\"zoom\" class=\"p-md r-sm bg-surface-raised border-width:1px border-style:solid b-line-divider animation-name:zoom@media(screen)@motion-safe animation-duration:var(--duration-fast)@media(screen)@motion-safe animation-timing-function:var(--easing-overshoot)@media(screen)@motion-safe\"><strong class=\"fg-text-strong\">New collection</strong><p class=\"mt-xs margin-bottom:0 fg-text-muted\">A brief scale entrance.</p></div></div><p class=\"mt-xs margin-bottom:0\" data-ui=\"label\"><output data-animation-readout=\"zoom\">Paused</output></p></section>\n</div>", caption: 'Both animations run once and start paused. Play and Replay control the native timelines. Reduced motion shows the content immediately without animation.' }} />
}

export function FoundationTransition() {
  return <Specimen name="state-transition" title="A transition needs two states" scene={{ html: "<label class=\"display:block width:280px max-width:100% font-sm transform:translateX(96px):has(input:checked)>span>span@media(screen)\">\n<input type=\"checkbox\" class=\"mr-xs accent-color-blue\"> Move layer\n<span aria-hidden=\"true\" class=\"display:block height:64px mt-md p-xs outline-width:1px outline-style:dashed outline-line-subtle\"><span id=\"layer\" class=\"display:grid place-items:center height:48px width:128px border-width:1px border-style:solid b-blue-60 r-sm font-sm bg-blue-10 fg-blue-80 transform:none transition-property:transform@media(screen)@motion-safe transition-duration:var(--duration-slow)@media(screen)@motion-safe transition-timing-function:var(--easing-overshoot)@media(screen)@motion-safe transition-delay:150ms@media(screen)@motion-safe\">Layer 01</span></span>\n</label><div data-ui=\"type-readings\"><span>Duration <output data-style-readout=\"layer\" data-style-property=\"transition-duration\">—</output></span><span>Delay <output data-style-readout=\"layer\" data-style-property=\"transition-delay\">—</output></span></div>", caption: 'The checkbox changes translateX from 0 to 96px. The 300ms transition starts after a 150ms delay. Reduced motion changes the state immediately; print keeps the initial position.' }} />
}

export function FoundationDialog() {
  return <Specimen name="dialog-entrance" title="Motion follows a real action" scene={{ sizing: 'viewport', height: 340, css: `@theme { :root {
  --duration-enter: 180ms;
  --easing-emphasized: cubic-bezier(.16, 1, .3, 1);
  --animate-dialog-in: dialog-in;
  --animate-dialog-in--duration: var(--duration-enter);
  --animate-dialog-in--timing-function: var(--easing-emphasized);
  --animate-dialog-in--iteration-count: 1;
  --animate-dialog-in--fill-mode: both;
} }
  @keyframes dialog-in {
    from { translate: 0 0.5rem; opacity: 0; }
    to { translate: 0; opacity: 1; }
  }
`, html: "<article class=\"p-md r-sm border-width:1px border-style:solid b-line-divider bg-surface-raised\"><h2 class=\"margin:0 text-lg font-semibold\">Collection settings</h2><p class=\"mt-xs mb-md fg-text-muted\">Open a native dialog to preview its entrance.</p><button id=\"open\" type=\"button\">Open details</button></article>\n<dialog id=\"details\" aria-labelledby=\"dialog-title\" aria-describedby=\"dialog-description\" class=\"width:calc(100%-32px) max-w-xs margin:auto p-md r-lg border-width:1px border-style:solid b-line-divider bg-surface-floating fg-text-body shadow-xl animate-dialog-in@media(screen)@motion-safe\">\n<h2 id=\"dialog-title\" class=\"margin:0 text-lg font-semibold fg-text-strong\">Collection details</h2><p id=\"dialog-description\" class=\"mt-sm mb-md\">This dialog has a finite entrance. Closing it is immediate.</p><form method=\"dialog\"><button autofocus>Close details</button></form>\n</dialog><script>const dialog = document.getElementById('details'); const openButton = document.getElementById('open'); openButton.addEventListener('click', () => dialog.showModal()); dialog.addEventListener('close', () => openButton.focus());</script>", caption: 'The dialog enters once on opening. Escape or Close details returns focus to its trigger. Reduced motion opens it immediately. Its modal boundary stays inside this preview.' }} />
}
