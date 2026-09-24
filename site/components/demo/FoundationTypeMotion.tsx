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
  return <Specimen name="type-hierarchy" title="A readable type hierarchy" scene={{ html: `<article class="p-md r-sm b:1px|solid|var(--color-line-base) surface-raised text-body">
<p class="m:0 text-xs font-medium text-blue">Field notes / 024</p>
<h2 class="mt-xs mb-sm text-2xl font-semibold text-strong">Make room for the details.</h2>
<p class="m:0 text-sm">A consistent type scale helps readers move from the main idea to the supporting detail.</p>
<p class="mt-md mb:0 font-mono font-xs text-muted">4 min read · Updated today</p>
</article>`, caption: 'Size, weight and color establish hierarchy. The full body copy stays visible at every preview width.' }} />
}

export function FoundationTypeComparison() {
  const authored = { ...section('type-comparison', 'Font size and text scale'), page: 'text-size', html: [
    `<!-- font-3xl · inherited leading and tracking -->
<div class="leading-md tracking-normal"><p id="target" class="m:0 font-3xl font-regular">Designing for a clearer reading experience.</p></div>`,
    `<!-- text-3xl · size, leading and tracking -->
<div class="leading-md tracking-normal"><p id="target" class="m:0 text-3xl font-regular">Designing for a clearer reading experience.</p></div>`,
  ] }
  return <Specimen name="type-comparison" title="One size, two type treatments" scene={typeSpecimens(authored, { properties: ['font-size', 'line-height', 'letter-spacing'], appearance: 'plain', caption: 'Both specimens have the same font size and content. font-3xl inherits the parent’s leading and tracking; text-3xl sets all three properties.' })} />
}

export function FoundationMotion() {
  return <Specimen name="finite-motion" title="Two finite entrances" scene={{ motion: true, html: `<div class="grid gap-lg">
<p class="m:0 text-sm text-muted display:none@reduce-motion display:none@print">Press Play to reveal the two cards.</p>
<section><p class="mb-sm text-sm font-medium">Fade · 300ms</p><div data-ui="surface"><div id="fade" class="p-md r-sm surface-raised b:1px|solid|var(--color-line-base) animation:fade|var(--duration-slow)|var(--easing-smooth)@screen&motion"><strong class="text-strong">Collection saved</strong><p class="mt-xs mb:0 text-muted">A quiet opacity entrance.</p></div></div><p class="mt-xs mb:0" data-ui="label"><output data-animation-readout="fade">Paused</output></p></section>
<section><p class="mb-sm text-sm font-medium">Zoom · 150ms</p><div data-ui="surface"><div id="zoom" class="p-md r-sm surface-raised b:1px|solid|var(--color-line-base) animation:zoom|var(--duration-fast)|var(--easing-overshoot)@screen&motion"><strong class="text-strong">New collection</strong><p class="mt-xs mb:0 text-muted">A brief scale entrance.</p></div></div><p class="mt-xs mb:0" data-ui="label"><output data-animation-readout="zoom">Paused</output></p></section>
</div>`, caption: 'Both animations run once and start paused. Play and Replay control the native timelines. Reduced motion shows the content immediately without animation.' }} />
}

export function FoundationTransition() {
  return <Specimen name="state-transition" title="A transition needs two states" scene={{ html: `<label class="block w:280px max-w:100% font-sm transform:translateX(96px):has(input:checked)>span>span@screen">
<input type="checkbox" class="mr-xs accent-color-blue"> Move layer
<span aria-hidden="true" class="block h:64px mt-md p-xs outline:1px|dashed|var(--color-line-muted)"><span id="layer" class="grid place-items:center h:48px w:128px b:1px|solid|var(--color-blue-60) r-sm font-sm bg-blue-10 fg-blue-80 transform:none transition:transform|var(--duration-slow)|var(--easing-overshoot)|150ms@screen&motion">Layer 01</span></span>
</label><div data-ui="type-readings"><span>Duration <output data-style-readout="layer" data-style-property="transition-duration">—</output></span><span>Delay <output data-style-readout="layer" data-style-property="transition-delay">—</output></span></div>`, caption: 'The checkbox changes translateX from 0 to 96px. The 300ms transition starts after a 150ms delay. Reduced motion changes the state immediately; print keeps the initial position.' }} />
}

export function FoundationDialog() {
  return <Specimen name="dialog-entrance" title="Motion follows a real action" scene={{ sizing: 'viewport', height: 340, css: `@theme {
  --duration-enter: 180ms;
  --easing-emphasized: cubic-bezier(.16, 1, .3, 1);
  --animate-dialog-in: dialog-in var(--duration-enter) var(--easing-emphasized) both;
  @keyframes dialog-in {
    from { translate: 0 0.5rem; opacity: 0; }
    to { translate: 0; opacity: 1; }
  }
}`, html: `<article class="p-md r-sm b:1px|solid|var(--color-line-base) surface-raised"><h2 class="m:0 text-lg font-semibold">Collection settings</h2><p class="mt-xs mb-md text-muted">Open a native dialog to preview its entrance.</p><button id="open" type="button">Open details</button></article>
<dialog id="details" aria-labelledby="dialog-title" aria-describedby="dialog-description" class="w:calc(100%-32px) max-w-xs m:auto p-md r-lg b:1px|solid|var(--color-line-base) surface-overlay text-body shadow-xl animate-dialog-in@screen&motion">
<h2 id="dialog-title" class="m:0 text-lg font-semibold text-strong">Collection details</h2><p id="dialog-description" class="mt-sm mb-md">This dialog has a finite entrance. Closing it is immediate.</p><form method="dialog"><button autofocus>Close details</button></form>
</dialog><script>const dialog = document.getElementById('details'); const openButton = document.getElementById('open'); openButton.addEventListener('click', () => dialog.showModal()); dialog.addEventListener('close', () => openButton.focus());</script>`, caption: 'The dialog enters once on opening. Escape or Close details returns focus to its trigger. Reduced motion opens it immediately. Its modal boundary stays inside this preview.' }} />
}
