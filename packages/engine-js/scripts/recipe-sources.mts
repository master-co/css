// Differential sources for mixins, utility recipes, `@apply`, keyframes and emitted
// globals. The default manifest has no mixins and few recipes, so these compile their
// own manifest from CSS with the Rust compiler (Wasm), then add keyframes in native
// containers that only stylesheet graphs produce.
import { createMasterCSSCompilerWasmProvider } from '../../binding-wasm-compiler/src/provider-node.ts'
import type { EmittedGlobals } from '../src/index.ts'
import type { EngineCase, EngineCaseStep } from './class-sources.mts'

const RECIPES_CSS = `
@theme {
  --color-red-60: #f00;
  --color-blue-50: #00f;
  --color-brand: var(--color-red-60);
  --spacing-sm: .5rem;
  --spacing-md: 1rem;
  --text-sm: .875rem;
  --text-sm--line-height: 1.5;
  --text-lg: 1.25rem;
  --animate-spin: spin 1s linear infinite;
  --animate-pulse: pulse 2s infinite;
  --animate-pair: spin 1s, wiggle 2s;
}
@theme static { --animate-glow: glow 2s infinite; }
@theme inline { --color-ink: #111; --spacing-gap: 3px; }
@custom-media --sm (width >= 40rem);
@custom-media --md (width >= 64rem);
@custom-media --dark (prefers-color-scheme: dark);
@custom-media --either (--sm) or (--dark);
@keyframes spin { to { rotate: 1turn } }
@keyframes pulse { 50% { opacity: .5; color: var(--color-brand) } }
@keyframes glow { to { box-shadow: 0 0 4px var(--color-blue-50) } }
@keyframes wiggle { 50% { rotate: 3deg } }
@mixin --hocus { &:hover, &:focus-visible { @contents; } }
@mixin --dark { @media (prefers-color-scheme: dark) { @contents; } }
@mixin --wide { @media (width >= 40rem) and (width < 64rem) { @contents; } }
@mixin --motion { @supports (animation-name: x) { @contents { animation: none } } }
@mixin --pad(--n: 1px) { padding: var(--n) }
@mixin --gap(--n <integer>: 2) { display: grid; gap: calc(var(--n) * 1px); grid-template-columns: repeat(var(--n), 1fr) }
@mixin --size(--k <string>) { font-size: var(ident("--text-" var(--k))) }
@mixin --anim(--name <custom-ident>) { animation-name: var(--name) }
@mixin --fade(--o <number>: .5) { opacity: var(--o) }
@mixin --card { color: red; &:hover { color: blue } .dark & { color: white } @media (width >= 40rem) { padding: 2px } }
@mixin --nest { @apply --hocus { @apply --dark { color: red } } }
@mixin --sandwich { color: red; @contents; color: blue }
@mixin --kids { & > * { margin: 0 } & + & { margin-top: 1px } }
@mixin --before { &::before { content: "" } }
@mixin --spin { animation: spin 1s }
@mixin --dyn { animation: var(--whatever) }
@mixin --theme { color: var(--color-ink); background: var(--color-brand) }
@utility btn { padding: 1px; @apply --hocus { color: red } }
@utility card { @apply --card; }
@utility spinner { animation: spin 1s linear infinite }
@utility glowing { animation: var(--animate-glow) }
@utility stack { display: flex; & > * + * { margin-top: 4px } @media (width >= 40rem) { flex-direction: row } }
@utility themed { @apply --theme; text-decoration: underline }
@utility tint-(--color) { color: var(--color); &:hover { background-color: var(--color) } }
@utility ink-(--color) { color: var(--color) }
@utility animate-(--animate) { animation: var(--animate) }
@utility size-(--text <string>) { font-size: var(ident("--text-" var(--text))); line-height: var(ident("--text-" var(--text) "--line-height"), normal) }
@utility gap-(--spacing) { gap: var(--spacing) }
@utility paint(--n) { color: var(--n) }
@utility cols(--n <integer>) { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)) }
@utility span(--n <integer>) { grid-column: span var(--n) }
@utility lines(--n <integer>) { -webkit-line-clamp: var(--n); display: -webkit-box }
@utility fade(--o <number>: .5) { opacity: var(--o) }
@utility pick(--a <custom-ident>, --b <string>: "x") { list-style-type: var(--a); content: var(--b) }
@utility shadow(--x, --y: 2px) { box-shadow: var(--x) var(--y) }
@utility run(--n <custom-ident>) { animation-name: var(--n) }
@utility spin-for(--d) { animation: spin var(--d) linear }
@utility pad(--n: 1px) { @apply --pad(var(--n)); }
@utility hov(--c) { &:hover { color: var(--c) } }
@utility sized(--k <string>) { @apply --size(var(--k)); &:hover { opacity: .5 } }
`

type Manifest = Record<string, unknown> & { keyframes: Record<string, unknown>[] }

async function compileManifest(css: string): Promise<Manifest> {
  const provider = await createMasterCSSCompilerWasmProvider() as { createSession(): Promise<any> }
  const compiler = await provider.createSession()
  const parsed = compiler.compileCSSDirectives(css)
  return compiler.lowerCSSDirectives({
    definitionSources: parsed.definitionSources,
    nativeOutput: parsed.nativeOutput,
    manifestInput: parsed.manifestInput,
    styleDefinitions: parsed.styleDefinitions ?? [],
    warnings: parsed.warnings ?? []
  }).manifest
}

const MOTION = { id: 'c-motion', prelude: '@media (prefers-reduced-motion: no-preference)' }

/** Keyframes in native containers, sharing a name with a managed one or retained, as stylesheet graphs compile them. */
const CONTAINED_KEYFRAMES = [
  { id: 'kx-wiggle', name: 'wiggle', text: '@keyframes wiggle{50%{rotate:6deg}}', containers: [MOTION] },
  { id: 'kx-spin', name: 'spin', text: '@keyframes spin{to{rotate:-1turn}}', containers: [MOTION, { id: 'c-rotate', prelude: '@supports (rotate: 1turn)' }], dependencies: ['color-blue-50'] },
  { id: 'kx-pulse', name: 'pulse', text: '@keyframes pulse{to{opacity:0}}', containers: [{ id: 'c-layer', prelude: '@layer motion' }] },
  { id: 'kx-hop', name: 'hop', text: '@keyframes hop{to{translate:0 -1px}}', retained: true, containers: [MOTION] },
  tileKeyframe('@keyframes tile{to{background-image:url(a.png)}}', 'url(a.png)')
]

function tileKeyframe(text: string, resource: string) {
  const start = text.indexOf(resource)
  return { id: 'kx-tile', name: 'tile', text, slotId: 'slot-tile', occurrence: 0, resources: [{ start, end: start + resource.length, value: resource }] }
}

const HEADS = [
  'btn', 'card', 'spinner', 'glowing', 'stack', 'themed',
  'tint-red-60', 'tint-brand', 'tint-ink', 'tint-blue-50', '-tint-red-60', 'tint-red-60/50', 'tint-nope', 'tint-',
  'ink-red-60', 'ink-ink', '-ink-red-60', 'ink-red-60/.5', 'ink-brand/50',
  'animate-spin', 'animate-pulse', 'animate-glow', 'animate-pair', 'animate-nope',
  'size-sm', 'size-lg', 'size-xl', 'size-sm--line-height', 'size-"sm"', 'size-a--b',
  'gap-md', 'gap-gap', '-gap-md',
  'paint(red)', 'paint(var(--color-red-60))', 'paint(var(--color-ink))', 'paint(attr(x))', 'paint(env(x))', 'paint(random(1,2))', 'paint(inherit)', 'paint(INITIAL)',
  'paint()', 'paint(red,blue)', 'paint(red|blue)', 'paint("a;b")', 'paint(a!b)', 'paint({x})', 'paint(--x)', 'paint(--x())', 'paint(rgb(1,2,3))', 'paint( red )',
  'paint(red))', 'paint(red', 'paint(red)x', 'PAINT(red)', 'paint([x)', 'paint(\'a|b\')', 'paint(a\\|b)',
  'cols(3)', 'cols(0)', 'cols(-1)', 'cols(1.5)', 'cols(+2)', 'cols(99999999999999999999)', 'cols(9223372036854775807)', 'cols(1e2)', 'cols(x)', 'cols(3px)', 'cols()', 'cols(2,3)',
  'span(2)', 'span(0)', 'span(-2)', 'lines(3)', 'lines(0)', 'lines(1.0)', 'lines(1e400)',
  'fade()', 'fade(.3)', 'fade(1e999)', 'fade(1e308)', 'fade(abc)', 'fade(-.5)', 'fade(50%)',
  'pick(disc)', 'pick(disc,"y")', "pick(disc,'y')", 'pick(disc,y)', 'pick(inherit)', 'pick(1)', 'pick(disc,"y",z)', 'pick(default)', 'pick(Disc)', 'pick(disc,"y)',
  'shadow(1px)', 'shadow(1px|2px,3px)', 'shadow(1px,)', 'shadow(,1px)', 'shadow(var(--spacing-md))',
  'run(spin)', 'run(wiggle)', 'run(nope)', 'run(pulse)', 'run("spin")', 'run(hop)',
  'spin-for(2s)', 'spin-for(var(--x))',
  'pad()', 'pad(3px)', 'pad(var(--spacing-md))', 'hov(red)', 'hov(var(--color-brand))', 'sized("sm")', 'sized("nope")', 'sized(sm)',
  'animation:spin|1s', 'animation-name:wiggle', 'animation:var(--animate-spin)', 'animation-name:var(--x)', 'animation:glow|1s,pulse|2s', 'animation-name:hop', '-webkit-animation:tile|1s'
]
const STATES = ['', ':hover', '!', ':hover!', '@sm', '@dark', ':focus@sm', '@layer(components)', '@media(print)', '@starting-style', '@either', '_span', '::before', '.x', '@sm@dark', '!@md', '@layer(base)@layer(utilities)']

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const APPLY_HEADS = [
  'color:red', 'color:red:hover', 'btn', 'card', 'tint-red-60', 'paint(blue)', 'size-sm', 'animation:spin|1s', 'color:var(--color-ink)', 'p:1px', 'padding:var(--spacing-md)',
  'stack', 'fg:red', 'color:red!', 'nope', 'color:red_.x', 'color:red::before', 'paint(attr(x))', 'cols(0)', 'gap-md:focus', 'themed', 'text-decoration:underline', 'ink-brand'
]
const APPLY_CALLS = [
  '@apply(--hocus)', '@apply(--dark)', '@apply(--wide)', '@apply(--motion)', '@apply(--pad(2px))', '@apply(--pad)', '@apply(--pad())', '@apply(--pad(1px|2px))',
  '@apply(--gap(3))', '@apply(--gap(x))', '@apply(--gap(0))', '@apply(--size("sm"))', '@apply(--size(sm))', '@apply(--anim(spin))', '@apply(--anim(inherit))',
  '@apply(--fade(.2))', '@apply(--card)', '@apply(--nest)', '@apply(--sandwich)', '@apply(--kids)', '@apply(--before)', '@apply(--spin)', '@apply(--dyn)', '@apply(--theme)',
  '@apply(--nope)', '@apply(hocus)', '@apply()', '@apply(--hocus', '@apply(--pad(2px)more)', '@apply(--hocus|x)', '@apply(--pad(var(--n)))', '@apply(--pad(attr(x)))',
  '@apply(--pad(;))', '@apply(--anim(wiggle))'
]
const APPLY_EXTRAS = [
  '@sm', '@dark', '@either', '@layer(components)', '@layer(base)', '@media(print)', '@media((--sm))', '@media((--nope))', '@media(screen|and|(min-width:1px))',
  '@unknown', '@starting-style', '@supports((display:grid))', '@container(card|(width>=1px))', '@media((width>=1px)|and|(width<2px))', '!'
]

export async function recipeSources(count: number, seed: number) {
  const managed = await compileManifest(`@prune native;${RECIPES_CSS}`)
  const retained = await compileManifest(RECIPES_CSS)
  const contained: Manifest = { ...managed, keyframes: [managed.keyframes[0], ...CONTAINED_KEYFRAMES.slice(0, 3), ...managed.keyframes.slice(1), ...CONTAINED_KEYFRAMES.slice(3)] }
  const changed = await compileManifest(`@prune native;${RECIPES_CSS.replace('rotate: 1turn', 'rotate: 2turn').replace('--color-brand: var(--color-red-60);', '--color-brand: var(--color-blue-50);')}`)

  const random = mulberry32(seed)
  const pick = <T,>(values: readonly T[]) => values[Math.floor(random() * values.length)]
  const classes = HEADS.flatMap((head) => STATES.map((state) => head + state))
  for (let index = 0; index < count; index++) classes.push(pick(HEADS) + pick(STATES) + (random() < .3 ? pick(STATES) : ''))

  const applyClasses = APPLY_HEADS.flatMap((head) => APPLY_CALLS.map((call) => head + call))
  const suffixes = [...APPLY_CALLS, ...APPLY_EXTRAS]
  for (let index = 0; index < count; index++) {
    let suffix = pick(APPLY_CALLS)
    for (let extra = Math.floor(random() * 3); extra > 0; extra--) suffix = random() < .5 ? pick(suffixes) + suffix : suffix + pick(suffixes)
    applyClasses.push(pick(APPLY_HEADS) + suffix + (random() < .15 ? '!' : ''))
  }

  const id = (manifest: Manifest, name: string) => manifest.keyframes.find((keyframe) => keyframe.name === name)!.id as string
  const keyframeClasses = ['spinner', 'animate-spin', 'run(spin)', 'run(wiggle)', 'animation-name:hop', 'animate-pulse', 'glowing', 'animation-name:var(--x)', 'card', 'animation:glow|1s,pulse|2s',
    'color:red@apply(--spin)', 'color:red@apply(--dyn)', 'spin-for(1s)@sm', 'animate-pair', '-webkit-animation:tile|1s', 'animation:var(--animate-pair)']
  const lifecycle: EngineCaseStep[] = [
    { op: 'ensure', classes: keyframeClasses.slice(0, 4) },
    { op: 'ensure', classes: keyframeClasses },
    { op: 'delete', classes: keyframeClasses.filter((_, index) => index % 2) },
    { op: 'delete', classes: ['spinner', 'animation-name:var(--x)'] },
    { op: 'ensure', classes: keyframeClasses.toReversed() },
    { op: 'delete', classes: keyframeClasses }
  ]
  const globalsSteps = (manifest: Manifest, next: Manifest): EngineCaseStep[] => {
    const spin = id(manifest, 'spin')
    const pulse = id(manifest, 'pulse')
    const glow = id(manifest, 'glow')
    const wiggle = id(manifest, 'wiggle')
    const step = (op: 'register' | 'replace', globals: EmittedGlobals): EngineCaseStep => ({ op, globals })
    return [
      { op: 'ensure', classes: keyframeClasses },
      step('register', { variables: { 'color-brand': 1 } }),
      step('register', { variables: { 'color-brand': 0, 'color-unknown': 2 } }),
      step('register', { keyframes: { [spin]: 1 } }),
      step('register', { keyframes: { [spin]: 2, [glow]: 0 } }),
      step('register', { keyframeSlots: [pulse, 'kx-spin'] }),
      step('register', { keyframeSlots: [pulse] }),
      step('register', { suppressedKeyframes: [wiggle] }),
      step('register', {}),
      { op: 'delete', classes: keyframeClasses.slice(0, 6) },
      step('replace', { keyframeSlots: [pulse, 'kx-spin'], suppressedKeyframes: [wiggle] }),
      step('replace', { keyframeSlots: [pulse, 'kx-spin'], suppressedKeyframes: [wiggle] }),
      step('replace', { keyframeSlots: ['kx-spin', pulse], suppressedKeyframes: [wiggle] }),
      step('replace', { variables: { 'color-red-60': 1, 'color-blue-50': 0 }, keyframes: { [glow]: 1, 'kx-hop': 2 }, suppressedKeyframes: ['kx-wiggle'] }),
      { op: 'ensure', classes: keyframeClasses },
      step('replace', {}),
      { op: 'refresh', manifest: next },
      { op: 'refresh', manifest: next, globals: { keyframes: { [id(next, 'spin')]: 1 }, keyframeSlots: ['kx-tile'] } },
      { op: 'refresh', invalid: 'truncated' },
      { op: 'refresh', invalid: 'garbage' },
      { op: 'refresh', manifest, globals: {} },
      { op: 'delete', classes: keyframeClasses.slice(3) },
      { op: 'refresh', manifest: 'default' },
      { op: 'ensure', classes: ['animate-fade', 'fg-red-60', ...keyframeClasses] },
      { op: 'refresh', manifest }
    ]
  }
  const engineCases: EngineCase[] = [
    { id: 'keyframes-managed', manifest: managed, steps: lifecycle },
    { id: 'keyframes-retained', manifest: retained, steps: lifecycle },
    { id: 'keyframes-contained', manifest: contained, steps: lifecycle },
    { id: 'keyframes-emitted', manifest: contained, steps: lifecycle, emittedGlobals: { keyframes: { [id(managed, 'spin')]: 1, 'kx-spin': 0 }, keyframeSlots: [id(managed, 'pulse'), 'kx-hop'], suppressedKeyframes: [id(managed, 'glow')], variables: { 'color-brand': 1 } } },
    { id: 'globals-managed', manifest: managed, steps: globalsSteps(managed, changed) },
    { id: 'globals-contained', manifest: contained, steps: globalsSteps(contained, retained) },
    { id: 'globals-contained-emitted', manifest: contained, steps: globalsSteps(contained, changed), emittedGlobals: { keyframes: { 'kx-hop': 1 }, keyframeSlots: ['kx-wiggle'] } }
  ]
  return { manifest: managed, classes, applyClasses, engineCases }
}
