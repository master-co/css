// Class sources for the differential harness. Every source returns raw candidates;
// invalid ones are kept on purpose, since both engines must reject them alike.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import type { Program } from '../src/index.ts'

export interface EngineCaseStep {
  op: 'ensure' | 'delete'
  classes: string[]
}

export interface EngineCase {
  id: string
  manifest: 'default' | Record<string, unknown>
  steps: EngineCaseStep[]
  emittedGlobals?: { variables?: Record<string, number> }
}

const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', '.next', '.nuxt', '.astro', '.output', 'target', '.git', '.turbo', 'artifacts', 'public'])

function walk(root: string, extensions: Set<string>, files: string[] = []) {
  let entries: string[]
  try {
    entries = readdirSync(root)
  } catch {
    return files
  }
  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry)) continue
    const path = join(root, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, extensions, files)
    else if (extensions.has(extname(entry))) files.push(path)
  }
  return files
}

// A class candidate has no whitespace or quotes and contains a Master CSS separator.
const CANDIDATE = /^[^\s"'`<>]{2,160}$/
function isCandidate(token: string) {
  return CANDIDATE.test(token) && /[:(@{!-]/.test(token) && !/^(https?:|\/\/|\.\/|\.\.\/)/.test(token)
}

function splitCandidates(text: string, into: Set<string>) {
  for (const token of text.split(/\s+/)) if (isCandidate(token)) into.add(token)
}

export function corpusEngineCases(root: string): EngineCase[] {
  const corpus = JSON.parse(readFileSync(join(root, 'parity/v2-language-corpus.json'), 'utf8')) as {
    engineCases: { id: string, manifest: EngineCase['manifest'], steps: { op: string, classes?: string[] }[] }[]
  }
  return corpus.engineCases.map((engineCase) => ({
    id: engineCase.id,
    manifest: engineCase.manifest,
    steps: engineCase.steps
      .filter((step): step is EngineCaseStep => (step.op === 'ensure' || step.op === 'delete') && Array.isArray(step.classes))
  }))
}

/** String literals in the Rust engine and compiler sources and tests. */
export function rustTestClasses(root: string) {
  const classes = new Set<string>()
  for (const crate of ['crates/mastercss-engine', 'crates/mastercss-compiler']) {
    for (const file of walk(join(root, crate), new Set(['.rs', '.json']))) {
      const text = readFileSync(file, 'utf8')
      // Plain Rust string literals and JSON strings; escapes stay as written.
      for (const match of text.matchAll(/"((?:[^"\\\n]|\\.){2,400})"/g)) {
        splitCandidates(match[1].replaceAll('\\\\', '\\').replaceAll('\\"', '"'), classes)
      }
    }
  }
  return classes
}

/** `class`, `className` and `class:list` attribute values in the site and examples. */
export function markupClasses(root: string) {
  const classes = new Set<string>()
  const files: string[] = []
  for (const directory of ['site', 'examples']) {
    walk(join(root, directory), new Set(['.html', '.tsx', '.jsx', '.vue', '.svelte', '.astro', '.md', '.mdx', '.ts', '.php']), files)
  }
  const attribute = /\b(?:class|className|class:list)\s*=\s*(?:\{\s*)?(["'`])([\s\S]*?)\1/g
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(attribute)) splitCandidates(match[2].replace(/\$\{[^}]*\}/g, ' '), classes)
  }
  return { classes, files: files.map((file) => relative(root, file)).length }
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

interface ManifestLike {
  utilities: { kind: string, name: string, parameters?: { syntax: string }[] }[]
  variables: Record<string, { key: string }[]>
  customMedia: Record<string, unknown>
  keyframes: { name: string }[]
}

const NATIVE_DECLARATIONS = [
  'display:block', 'display:flex', 'display:grid', 'width:10px', 'width:calc(100%-2rem)', 'height:50%',
  'margin:-.25rem', 'margin:0.25rem', 'padding:1rem|2rem', 'color:#fff', 'color:rgb(0,0,0,0.75)',
  'background-color:oklch(60%|.2|240/.5)', 'border:1px|solid|var(--color-red-60)', 'font-size:min(.625rem,calc(1.5625rem-.625rem))',
  'transition:opacity|300ms|ease|100ms', 'animation:fade|1s', 'opacity:.5', 'z-index:10', 'gap:1.5rem', 'inset:0',
  'content:\'a_b\'', 'grid-template-columns:repeat(3,1fr)', 'transform:translate(1px,2px)', 'line-height:1.2',
  'width:clamp(1px,2px+3px,4px)', 'top:1', 'margin-top:2', 'font-weight:600', '--x:1', 'aspect-ratio:16/9'
]
const STATES = [':hover', ':focus', ':active', ':first', '::before', '::after', ':nth-child(2n+1)', '.active', '[disabled]', ':not(.disabled)', ':is(_foo)', ':of(.active>)', '_button', ':where(h1,h2)']
const PRIMITIVE_CONDITIONS = ['@layer(base)', '@layer(defaults)', '@layer(components)', '@starting-style', '@print']

/** Grammar-driven combinations of utilities, values, states and conditions. */
export function fuzzClasses(manifest: ManifestLike, count: number, seed: number) {
  const random = mulberry32(seed)
  const pick = <T,>(values: readonly T[]) => values[Math.floor(random() * values.length)]
  const namespaces = Object.entries(manifest.variables).filter(([, values]) => values.length)
  const media = Object.keys(manifest.customMedia).map((name) => `@${name.slice(2)}`)
  const conditions = [...media, ...PRIMITIVE_CONDITIONS]
  const keyframes = manifest.keyframes.map((keyframe) => keyframe.name)
  const bases: (() => string)[] = [
    () => pick(NATIVE_DECLARATIONS),
    () => {
      const utility = pick(manifest.utilities.filter((entry) => entry.kind === 'token'))
      const [, values] = pick(namespaces)
      return `${utility.name}-${pick(values).key}`
    },
    () => {
      const utility = pick(manifest.utilities.filter((entry) => entry.kind === 'function'))
      return `${utility.name}(${1 + Math.floor(random() * 12)})`
    },
    () => pick(manifest.utilities.filter((entry) => entry.kind === 'static')).name,
    () => `animation:${pick(keyframes)}|${pick(['1s', '300ms', '2s|infinite'])}`,
    () => `{${pick(NATIVE_DECLARATIONS)};${pick(NATIVE_DECLARATIONS)}}`
  ]
  const classes = new Set<string>()
  for (let attempt = 0; classes.size < count && attempt < count * 10; attempt++) {
    let className = pick(bases)()
    if (random() < 0.12) className = `-${className}`
    if (random() < 0.1) className += '!'
    if (random() < 0.45) className += pick(STATES)
    if (random() < 0.15) className += pick(STATES)
    if (random() < 0.45) className += pick(conditions)
    if (random() < 0.1) className += pick(conditions)
    classes.add(className)
  }
  return classes
}

/** Every token key of every registered token utility, signed, with opacity and with importance. */
export function tokenClasses(program: Program) {
  const classes = new Set<string>()
  const ALPHAS = ['/.5', '/0', '/1', '/.07', '/5e-1', '/50', '/1.5', '/-.5', '/']
  for (const utility of program.utilities) {
    if (utility.nativeFallback) continue
    const keys = new Set(utility.variableAliases.map(([alias]) => alias))
    for (const reference of utility.variableAliasRefs) {
      const namespace = `${reference.replace(/^~/, '')}-`
      for (const name of program.variableOrder) if (name.startsWith(namespace)) keys.add(name.slice(namespace.length))
    }
    for (const matcher of utility.matchers) {
      if (matcher.type !== 'token') continue
      for (const key of [...keys, 'unknown-key', '', '-x', 'x-', 'md|lg']) {
        const className = matcher.prefix + key
        classes.add(className)
        classes.add(`-${className}`)
        classes.add(`${className}!`)
        classes.add(className + ALPHAS[classes.size % ALPHAS.length])
      }
    }
  }
  return classes
}

const PROPERTIES = [
  'width', 'height', 'margin', 'margin-top', 'padding', 'inset', 'top', 'color', 'background', 'background-color', 'border',
  'font', 'font-family', 'font-size', 'line-height', 'content', 'grid-template-columns', 'grid-area', 'transform', 'transition',
  'box-shadow', 'filter', 'backdrop-filter', 'text-decoration', 'user-select', 'mask-image', 'aspect-ratio', 'z-index', 'opacity',
  'gap', '--x', '--color-red-60', 'p', 'm', 'w', 'fg', 'bg', 'foo-bar', '-webkit-line-clamp', 'ünder', 'b\\:x', 'mar\\67 in', '--'
]
const UNITS = ['', 'px', 'rem', 'em', '%', 'vw', 'deg', 'ms', 's', 'x', 'fr', 'e', 'e3', 'E-2px']
const IDENTS = ['auto', 'none', 'red', 'solid', 'inherit', 'sans-serif', 'currentColor', 'max-content', '-webkit-box', 'a_b', 'x\\:y', '✓']
const VARIABLES = ['var(--color-red-60)', 'var(--spacing-md)', 'var(--spacing-md,1px)', 'var(--unknown)', 'var(--color-red-60,var(--spacing-md))', 'VAR(--spacing-md)', 'v\\61r(--spacing-md)', 'var(  --spacing-md  )']
const STRINGS = ['"a"', "'a_b'", '"x|y"', "'it\\'s'", '"\\2014"', '"😀"', '"a\\\nb"', "'unclosed", '"(|)"']
const OTHERS = ['#fff', '#0000', 'url(a.png)', 'url("x|y")', 'url(a(b)', '/*c*/', '\\2014', '!important', '1/2', 'calc(1px', ')', '{a}', 'a;b', '[x]']

/** Grammar-driven native declarations: math, functions, references, strings, escapes and separators. */
export function valueClasses(count: number, seed: number) {
  const random = mulberry32(seed)
  const pick = <T,>(values: readonly T[]) => values[Math.floor(random() * values.length)]
  const number = () => `${pick(['', '', '-', '+'])}${pick(['0', '1', '2', '10', '.5', '0.25', '1.5', '100', '1e3', '007'])}${pick(UNITS)}`
  const atom = (depth: number): string => {
    const roll = random()
    if (roll < 0.35) return number()
    if (roll < 0.5) return pick(IDENTS)
    if (roll < 0.6) return pick(VARIABLES)
    if (roll < 0.67) return pick(STRINGS)
    if (roll < 0.72) return pick(OTHERS)
    if (depth > 2) return number()
    const name = pick(['calc', 'min', 'max', 'clamp', 'CALC', 'rgb', 'translate', 'repeat', 'oklch', '', 'cubic-bezier', 'env'])
    return `${name}(${expression(depth + 1)})`
  }
  const expression = (depth: number): string => {
    let text = atom(depth)
    for (let terms = Math.floor(random() * 4); terms > 0; terms--) text += pick(['+', '-', '*', '/', ',', '|', ' ', '|+|', '-', '- ', ', ']) + atom(depth)
    return text
  }
  const classes = new Set<string>()
  for (let attempt = 0; classes.size < count && attempt < count * 10; attempt++) {
    let className = `${pick(PROPERTIES)}:${expression(0)}`
    if (random() < 0.1) className += '!'
    if (random() < 0.03) className += '!'
    classes.add(className)
  }
  return classes
}

const ROOT = [':root,:host']
const tokenUtility = (name: string, namespace: string, property: string) => ({
  kind: 'token',
  name,
  parameters: [{ name: `--${namespace}` }],
  body: [{ type: 'declaration', property, value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: `--${namespace}` }] }] }]
})

/**
 * Manifests the default one lacks: inline and static theme tokens, `!important`
 * values, dependency graphs, escaped names, and host-emitted variable counts.
 */
export function themeEngineCases(): EngineCase[] {
  const variables = {
    spacing: [
      { key: 'sm', type: 'number', values: [{ path: ROOT, value: '4px', inline: true }] },
      { key: 'md', type: 'number', values: [{ path: ROOT, value: '8px' }] },
      { key: 'lg', type: 'number', values: [{ path: ROOT, value: '1rem !important', inline: true }, { path: ['.dark'], value: '2rem' }] },
      { key: 'xl', type: 'number', values: [{ path: ROOT, value: '1px' }, { path: ['.x'], value: '2px!IMPORTANT', inline: true }] },
      { key: 'xs', type: 'number', dependencies: ['spacing-sm'], values: [{ path: ROOT, value: 'calc(var(--spacing-sm)/2)' }] },
      { key: '2x', type: 'number', values: [{ path: ROOT, value: '!important', inline: true }] }
    ],
    color: [
      { key: 'red', values: [{ path: ROOT, value: '#f00', inline: true }] },
      { key: 'blue', values: [{ path: ROOT, value: '#00f' }] },
      { key: 'd', values: [{ path: ROOT, value: '#ddd' }] },
      { key: 'b', dependencies: ['color-d'], values: [{ path: ROOT, value: 'var(--color-d)' }] },
      { key: 'c', dependencies: ['color-d', 'color-blue'], values: [{ path: ROOT, value: 'var(--color-d,var(--color-blue))' }] },
      { key: 'a', dependencies: ['color-b', 'color-c', 'color-missing'], values: [{ path: ROOT, value: 'var(--color-b)' }, { path: ['.dark'], value: 'var(--color-c)' }] },
      { key: 'ü', values: [{ path: ROOT, value: 'lime' }] },
      { key: '9', values: [{ path: ROOT, value: 'navy' }] },
      { key: 'x_y', values: [{ path: ROOT, value: 'teal' }] }
    ],
    '': [
      { name: 'stripe', key: 'stripe', values: [{ path: ROOT, value: 'linear-gradient(red,blue)', static: true }] },
      { name: 'gutter', key: 'gutter', dependencies: ['spacing-md'], values: [{ path: ROOT, value: 'var(--spacing-md)', static: true }] }
    ]
  }
  const declarations = (path: string) => Object.entries(variables).flatMap(([namespace, entries]) => entries.flatMap((entry) => entry.values
    .filter((value) => value.path[0] === path)
    .map((value) => ({ type: 'declaration', name: 'name' in entry ? entry.name : `${namespace}-${entry.key}`, value: value.value }))))
  const manifest = {
    version: 6,
    languageVersion: 16,
    variables,
    theme: [':root,:host', '.dark', '.x'].map((prelude) => ({ type: 'rule', prelude, children: declarations(prelude) })),
    customMedia: {},
    utilities: [tokenUtility('gap', 'spacing', 'gap'), tokenUtility('m', 'spacing', 'margin'), tokenUtility('fg', 'color', 'color')]
  }
  const classes = [
    'gap-sm', 'gap-md', 'gap-lg', 'gap-xl', 'gap-xs', 'gap-2x', 'm-sm', '-m-md', '-m-sm', 'm-lg!', 'fg-red', 'fg-red/.5', 'fg-blue',
    'fg-a', 'fg-b', 'fg-c', 'fg-ü', 'fg-9', 'fg-x_y', 'fg-a/.25', 'gap:var(--spacing-sm)', 'margin:calc(var(--spacing-lg)*2)',
    'color:var(--color-red,blue)', 'background:var(--stripe)', 'width:var(--spacing-xs)', 'color:var(--color-a)', 'gap:var(--gutter)'
  ]
  const steps: EngineCaseStep[] = [
    { op: 'ensure', classes: classes.slice(0, 10) },
    { op: 'ensure', classes },
    { op: 'delete', classes: classes.filter((_, index) => index % 2) },
    { op: 'ensure', classes: ['fg-a', 'fg-c', 'gap-xs'] },
    { op: 'delete', classes: ['fg-a'] },
    { op: 'delete', classes },
    { op: 'ensure', classes: classes.slice(5) },
    { op: 'delete', classes }
  ]
  return [
    { id: 'theme-tokens', manifest, steps },
    { id: 'theme-tokens-emitted', manifest, steps, emittedGlobals: { variables: { 'spacing-md': 1, 'color-d': 2, 'color-unknown': 1, 'spacing-sm': 0 } } }
  ]
}

const NOISE = [
  ...':;{}()[]"\'\\|!@_.-+*/#,~>%=&?<$^`', 'a', 'z', 'A', '0', '9', 'e', 'E', ' ', '\t', '\n', '\r', '\f', '\0', '\x7f',
  'é', 'ü', '✓', '😀', '\ud800', '\udc00', '\ufffd', '\u0085', '\ufeff', '\u00a0', '\u2028', 'calc(', 'var(--', '--', '/*', '*/', 'url('
]
const NOISE_HEADS = ['', '', 'color:', 'margin:', 'fg-', 'm-', '-m-', 'content:', 'width:calc(', '--x:', 'gap-', 'bg-red-60']

/** Arbitrary text around class syntax: controls, lone surrogates and Unicode whitespace included. */
export function noiseClasses(count: number, seed: number) {
  const random = mulberry32(seed)
  const pick = <T,>(values: readonly T[]) => values[Math.floor(random() * values.length)]
  const classes = new Set<string>()
  for (let attempt = 0; classes.size < count && attempt < count * 10; attempt++) {
    let className = pick(NOISE_HEADS)
    for (let length = 1 + Math.floor(random() * 24); length > 0; length--) className += pick(NOISE)
    classes.add(className)
  }
  return classes
}
