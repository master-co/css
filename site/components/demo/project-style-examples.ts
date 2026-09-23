export interface ProjectStyleExample {
  title: string
  source: string
  html: string
  caption: string
  guide: string
  theme?: boolean
}

export const projectStyleExamples = {
  tokens: {
    title: 'A small project vocabulary',
    source: `@theme {
  --color-brand: var(--color-text-link);
  --spacing-card: 1.5rem;
  --radius-card: .75rem;
}`,
    html: `<article class="p:card r:card b:1px|solid|base surface:raised text:body">
  <p class="m:0 font:mono text:xs fg:brand">FIELD NOTES / 024</p>
  <h2 class="mt:sm mb:xs text:xl font:semibold text:strong">Room for the details</h2>
  <p class="m:0 text:sm">Color, spacing and radius come from three shared project tokens.</p>
</article>`,
    caption: 'p:card reads spacing, r:card reads radius, and fg:brand reads color. Each class retains a reference to its theme variable.',
    guide: '/guide/theme',
  },
  spacing: {
    title: 'One spacing token, two consumers',
    source: `@theme {
  --spacing-card: 1.5rem;
}`,
    html: `<div class="grid gap:md">
  <article class="p:card r:sm b:1px|solid|base surface:raised">
    <h2 class="m:0 text:lg font:semibold">Collection</h2>
    <p class="mt:xs mb:0 text:sm text:muted">The article uses p:card.</p>
  </article>
  <aside class="p:card r:sm b:1px|solid|base surface:raised text:sm">
    The note uses the same p:card class.
  </aside>
</div>`,
    caption: 'Both elements have 1.5rem of padding. A change to --spacing-card applies to both consumers.',
    guide: '/guide/variables-and-modes',
  },
  modes: {
    title: 'The same card in two modes',
    source: `@settings {
  mode-trigger: class;
  default-mode: light;
}

@theme light {
  --color-surface-card: var(--color-white);
  --color-text-card: var(--color-neutral-70);
}

@theme dark {
  --color-surface-card: var(--color-gray-90);
  --color-text-card: var(--color-gray-20);
}`,
    html: `<article class="p:lg r:lg b:1px|solid|base surface:card text:card">
  <h2 class="m:0 text:lg font:semibold">Collection details</h2>
  <p class="mt:sm mb:0 text:sm">The class list stays the same when the active mode changes.</p>
</article>`,
    caption: 'Theme switches the preview document’s light/dark class. The browser resolves the actual generated custom properties.',
    guide: '/guide/variables-and-modes#add-modes-after-the-shared-value-works',
    theme: true,
  },
  components: {
    title: 'A component with native interaction states',
    source: `@components {
  btn {
    @compose inline-flex items-center justify-center px:md py:xs r:md b:0 font:sm font:medium bg:blue-60 fg:white;

    &:hover {
      @compose bg:blue-70;
    }

    &:focus-visible {
      @compose outline:2px|solid|blue-60 outline-offset:4xs;
    }
  }
}`,
    html: `<button type="button" class="btn">Preview button</button>`,
    caption: 'Hover or focus the button to inspect its shared states.',
    guide: '/guide/global-styles#component-classes',
  },
  layers: {
    title: 'A local utility overrides the component',
    source: `@components {
  card {
    @compose p:lg r:lg b:1px|solid|base surface:raised text:body;
  }
}`,
    html: `<div class="grid gap:md">
  <article class="card">
    <h2 class="m:0 text:lg font:semibold">Standard card</h2>
    <p class="mt:xs mb:0 text:sm">card sets 1.5rem of padding.</p>
  </article>
  <article class="card p:sm">
    <h2 class="m:0 text:lg font:semibold">Compact card</h2>
    <p class="mt:xs mb:0 text:sm">p:sm changes this instance to .75rem.</p>
  </article>
</div>`,
    caption: 'The same component is used twice. With the base layer order loaded, the normal padding utility wins in the second card.',
    guide: '/guide/cascade-layers',
  },
  nativeField: {
    title: 'A field that follows its content',
    source: '',
    html: `<label for="project-note" class="block mb:xs text:sm font:medium">Project note</label>
<textarea id="project-note" rows="3"
  class="block field-sizing:content min-w:0 max-w:full w:full
         min-h:6rem max-h:12rem p:sm b:1px|solid|base r:sm
         surface:raised text:body font:inherit resize:vertical
         outline:2px|solid|blue:focus-visible outline-offset:2px:focus-visible"
  aria-describedby="note-help">Keep the interaction close to its context.</textarea>
<p id="note-help" class="mt:xs mb:0 text:xs text:muted">Add a few lines to try content-based sizing.</p>`,
    caption: 'The textarea uses native field-sizing. Minimum and maximum heights bound the enhancement; unsupported browsers retain a usable field.',
    guide: '/guide/compatibility#native-declarations',
  },
  checkedSelector: {
    title: 'Selection with a native selector',
    source: '',
    html: `<div class="p:md b:1px|solid|base r:sm surface:raised
            border-color:blue:has(:checked)">
  <label class="flex items-start gap:sm text:sm">
    <input type="checkbox" class="mt:3xs accent-color:blue
      outline:2px|solid|blue:focus-visible outline-offset:2px:focus-visible" />
    <span>Include project notes
      <span class="block mt:2xs text:xs text:muted">The card border follows the checkbox.</span>
    </span>
  </label>
</div>`,
    caption: 'Check the option with a pointer or the Space key. :has(:checked) adds a border cue; the native checkbox carries the state.',
    guide: '/guide/compatibility#new-selectors',
  },
} satisfies Record<string, ProjectStyleExample>

export type ProjectStyleName = keyof typeof projectStyleExamples

export function projectStyleExample(name: string): ProjectStyleExample {
  if (!Object.hasOwn(projectStyleExamples, name)) throw new Error(`Unknown project style example: ${name}`)
  return projectStyleExamples[name as ProjectStyleName]
}
