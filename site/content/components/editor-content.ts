/*
 * Data for the homepage's Editor section: one file in one editor, where a caret and a pointer
 * walk through the language service features. `home-content.test.ts` checks every sample against
 * the real language service, so the figure only shows what the editor would show.
 * This module stays free of heavy imports: the client stage reads its types and the completion filter.
 */

export type EditorSceneId = 'complete' | 'hover' | 'highlight' | 'color'

export interface EditorFeature {
  id: EditorSceneId
  title: string
  body: string
}

/** The features the stage walks through, in tour order. */
export const editorFeatures = [
  {
    id: 'complete',
    title: 'Manifest completions',
    body: 'Complete utilities, values, selectors, queries and tokens from your project manifest.'
  },
  {
    id: 'hover',
    title: 'Hover inspection',
    body: 'Hover a class to see the CSS it generates, including its state and query.'
  },
  {
    id: 'highlight',
    title: 'Focused highlighting',
    body: 'Markup stays calm until the cursor enters a class string; then its class context lights up.'
  },
  {
    id: 'color',
    title: 'Color tools',
    body: 'A swatch beside every color class that resolves to one color. Edit literal colors with the native picker.'
  }
] as const satisfies readonly EditorFeature[]

export const editorFileName = 'usage-alerts.html'

/** The file in the editor, as it reads once the completion below is accepted. Valid and sorted. */
export const editorSource = `<article class="display:grid gap-lg p-xl b-line-divider r-2xl border-style:solid border-width:1px bg-surface-raised shadow-sm">
  <header class="display:flex align-items:center justify-content:space-between gap-md">
    <h3 class="text-lg font-medium fg-text-strong">Usage alerts</h3>
    <a class="text-sm font-medium fg-blue-60 fg-blue-70:hover@sm" href="/settings/alerts">Manage</a>
  </header>
  <p class="text-sm fg-text-muted">Email the team before a project reaches its monthly limit.</p>
  <ul class="display:grid gap-xs p-md r-lg bg-surface-base grid-cols(2)@md">
    <li class="display:flex align-items:center justify-content:space-between gap-sm text-sm">
      Builds
      <span class="px-xs r-md text-xs font-semibold bg-blue-60/.1 color:#4f46e5">80%</span>
    </li>
    <li class="display:flex align-items:center justify-content:space-between gap-sm text-sm">
      Bandwidth
      <span class="px-xs r-md text-xs font-semibold bg-surface-raised fg-text-muted">42%</span>
    </li>
  </ul>
</article>`

/**
 * The completion the caret types: on `line`, after the class `after`, it types a space and the
 * prefix (the trigger character `-` asks the language service for completions), then `query`
 * narrows the list and the first item, `label`, is accepted.
 */
export const editorCompletion = {
  line: 5,
  after: 'text-sm',
  prefix: 'fg-text-',
  query: 'mu',
  label: 'fg-text-muted'
} as const

/** Every completion the language service returns at `fg-text-`, in its order. */
export const editorCompletionLabels = [
  'fg-text-amber',
  'fg-text-beryl',
  'fg-text-blue',
  'fg-text-body',
  'fg-text-brown',
  'fg-text-crimson',
  'fg-text-cyan',
  'fg-text-disabled',
  'fg-text-fuchsia',
  'fg-text-gray',
  'fg-text-green',
  'fg-text-indigo',
  'fg-text-inverse',
  'fg-text-lime',
  'fg-text-link-hover',
  'fg-text-link',
  'fg-text-muted',
  'fg-text-neutral',
  'fg-text-orange',
  'fg-text-pink',
  'fg-text-purple',
  'fg-text-red',
  'fg-text-sky',
  'fg-text-slate',
  'fg-text-stone',
  'fg-text-strong',
  'fg-text-teal',
  'fg-text-violet',
  'fg-text-yellow',
  'fg-text-zinc'
] as const

/** The detail the language service gives the accepted completion. */
export const editorCompletionDetail = '(token --color-text-muted) :root,:host: light-dark(var(--color-zinc-60), var(--color-zinc-40))'

/** The class the pointer inspects: a token with a state and a query. */
export const editorHoverClass = 'fg-blue-70:hover@sm'

/**
 * The classes the language service decorates with a swatch, where the swatch sits in the class,
 * and the color it shows. Tokens that switch with the color scheme, such as `fg-text-muted`,
 * resolve to no single color and get none. `literal` is the color the picker edits in place.
 */
export const editorSwatches = [
  { className: 'fg-blue-60', at: 0, token: ['blue', 60] },
  { className: 'fg-blue-70:hover@sm', at: 0, token: ['blue', 70] },
  { className: 'bg-blue-60/.1', at: 0, token: ['blue', 60], alpha: 0.1 },
  { className: 'color:#4f46e5', at: 'color:'.length, literal: '#4f46e5' }
] as const satisfies readonly EditorSwatch[]

export interface EditorSwatch {
  className: string
  at: number
  /** A preset palette color, as a name and a level. */
  token?: readonly [name: string, level: number]
  literal?: string
  alpha?: number
}

/** How markup outside class strings is colored. */
export type EditorTone = 'tag' | 'attr' | 'punct' | 'string' | 'text'

/** What a part of a class means, from the language service's semantic tokens. */
export type EditorRole = 'utility' | 'property' | 'value' | 'number' | 'selector' | 'query' | 'punct' | 'base'

/** A run of markup, or a class string whose items are spaces or indexes into `EditorModel.classes`. */
export type EditorSpan = { text: string, tone: EditorTone } | { context: number, items: (string | number)[] }

export interface EditorClass {
  name: string
  line: number
  /** The source column the class starts at. */
  column: number
  /** The class string it belongs to; the editor lights one class string at a time. */
  context: number
  parts: [text: string, role: EditorRole][]
  /** An index into `EditorModel.hovers`. */
  hover: number
  swatch?: { at: number, color: string }
}

/** What the language service shows on hover: the tokens the class uses and the CSS it generates. */
export interface EditorHover {
  tokens: string[]
  css: string
}

/** Everything the client stage renders, computed on the server from the language service. */
export interface EditorModel {
  fileName: string
  lines: EditorSpan[][]
  classes: EditorClass[]
  hovers: EditorHover[]
  /** Where the completion is typed: the space before `classIndex` on `line`, at `column`. */
  insertion: { line: number, column: number, classIndex: number }
  hoverClass: number
  literalClass: number
  completion: { prefix: string, query: string, label: string, labels: string[], detail: string }
}

export interface EditorCompletionMatch {
  label: string
  /** Character indexes in the label that the typed word matched, for emphasis. */
  matches: number[]
}

/**
 * The editor narrows the language service's list by the word typed after the trigger, the way
 * VS Code does: labels that start with the word first, then labels that contain it, then labels
 * that contain its characters in order. Ties keep the language service's order.
 */
export function filterCompletions(labels: readonly string[], prefix: string, query: string): EditorCompletionMatch[] {
  const head = [...prefix].map((_, index) => index)
  return labels
    .flatMap((label, order) => {
      if (!label.startsWith(prefix)) return []
      const rest = label.slice(prefix.length)
      const at = rest.indexOf(query)
      if (at >= 0) {
        const matched = [...query].map((_, index) => prefix.length + at + index)
        return [{ label, order, rank: at === 0 ? 0 : 1, matches: [...head, ...matched] }]
      }
      const matches: number[] = []
      let from = 0
      for (const character of query) {
        const index = rest.indexOf(character, from)
        if (index < 0) return []
        matches.push(prefix.length + index)
        from = index + 1
      }
      return [{ label, order, rank: 2, matches: [...head, ...matches] }]
    })
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .map(({ label, matches }) => ({ label, matches }))
}
