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
    source: "@theme { :root, :host {\n  --color-brand: var(--color-text-link);\n  --spacing-card: 1.5rem;\n  --radius-card: .75rem;\n} }\n",
    html: "<article class=\"p-card r-card border-width:1px border-style:solid b-line-divider bg-surface-raised fg-text-body\">\n  <p class=\"margin:0 font-mono text-xs fg-brand\">FIELD NOTES / 024</p>\n  <h2 class=\"mt-sm mb-xs text-xl font-semibold fg-text-strong\">Room for the details</h2>\n  <p class=\"margin:0 text-sm\">Color, spacing and radius come from three shared project tokens.</p>\n</article>",
    caption: 'p-card reads spacing, r-card reads radius, and fg-brand reads color. Each class retains a reference to its theme variable.',
    guide: '/guide/theme',
  },
  spacing: {
    title: 'One spacing token, two consumers',
    source: "@theme { :root, :host {\n  --spacing-card: 1.5rem;\n} }\n",
    html: "<div class=\"display:grid gap-md\">\n  <article class=\"p-card r-sm border-width:1px border-style:solid b-line-divider bg-surface-raised\">\n    <h2 class=\"margin:0 text-lg font-semibold\">Collection</h2>\n    <p class=\"mt-xs margin-bottom:0 text-sm fg-text-muted\">The article uses p-card.</p>\n  </article>\n  <aside class=\"p-card r-sm border-width:1px border-style:solid b-line-divider bg-surface-raised text-sm\">\n    The note uses the same p-card class.\n  </aside>\n</div>",
    caption: 'Both elements have 1.5rem of padding. A change to --spacing-card applies to both consumers.',
    guide: '/guide/variables-and-modes',
  },
  modes: {
    title: 'The same card in two modes',
    source: "\n\n@theme { .light {\n  --color-surface-card: var(--color-white);\n  --color-text-card: var(--color-neutral-70);\n} }\n\n\n@theme { .dark {\n  --color-surface-card: var(--color-gray-90);\n  --color-text-card: var(--color-gray-20);\n} }\n",
    html: "<article class=\"p-lg r-lg border-width:1px border-style:solid b-line-divider bg-surface-card fg-text-card\">\n  <h2 class=\"margin:0 text-lg font-semibold\">Collection details</h2>\n  <p class=\"mt-sm margin-bottom:0 text-sm\">The class list stays the same when the active mode changes.</p>\n</article>",
    caption: 'Theme switches the preview document’s light/dark class. The browser resolves the actual generated custom properties.',
    guide: '/guide/variables-and-modes#add-modes-after-the-shared-value-works',
    theme: true,
  },
  components: {
    title: 'A component with native interaction states',
    source: `@layer components {
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    padding-block: var(--spacing-xs);
    padding-inline: var(--spacing-md);
    border-width: 0;
    background-color: var(--color-blue-60);
    color: oklch(100% 0 none);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);

    &:hover {
      background-color: var(--color-blue-70);
    }

    &:focus-visible {
      outline: 2px solid var(--color-blue-60);
      outline-offset: var(--spacing-4xs);
    }
  }
}`,
    html: `<button type="button" class="btn">Preview button</button>`,
    caption: 'Hover or focus the button to inspect its shared states.',
    guide: '/guide/global-styles#component-classes',
  },
  layers: {
    title: 'A local utility overrides the component',
    source: `@layer components {
  .card {
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    border: 1px solid var(--color-line-divider);
    background-color: var(--color-surface-raised);
    color: var(--color-text-body);
  }
}`,
    html: "<div class=\"display:grid gap-md\">\n  <article class=\"card\">\n    <h2 class=\"margin:0 text-lg font-semibold\">Standard card</h2>\n    <p class=\"mt-xs margin-bottom:0 text-sm\">card sets 1.5rem of padding.</p>\n  </article>\n  <article class=\"card p-sm\">\n    <h2 class=\"margin:0 text-lg font-semibold\">Compact card</h2>\n    <p class=\"mt-xs margin-bottom:0 text-sm\">p-sm changes this instance to .75rem.</p>\n  </article>\n</div>",
    caption: 'The same component is used twice. With the base layer order loaded, the normal padding utility wins in the second card.',
    guide: '/guide/cascade-layers',
  },
  nativeField: {
    title: 'A field that follows its content',
    source: '',
    html: "<label for=\"project-note\" class=\"display:block mb-xs text-sm font-medium\">Project note</label>\n<textarea id=\"project-note\" rows=\"3\"\n  class=\"display:block field-sizing:content min-width:0 max-width:100% width:100%\n         min-height:6rem max-height:12rem p-sm border-width:1px border-style:solid b-line-divider r-sm\n         bg-surface-raised fg-text-body font:inherit resize:vertical\n         outline-width:2px:focus-visible outline-style:solid:focus-visible outline-blue:focus-visible outline-offset:2px:focus-visible\"\n  aria-describedby=\"note-help\">Keep the interaction close to its context.</textarea>\n<p id=\"note-help\" class=\"mt-xs margin-bottom:0 text-xs fg-text-muted\">Add a few lines to try content-based sizing.</p>",
    caption: 'The textarea uses native field-sizing. Minimum and maximum heights bound the enhancement; unsupported browsers retain a usable field.',
    guide: '/guide/compatibility#native-declarations',
  },
  checkedSelector: {
    title: 'Selection with a native selector',
    source: '',
    html: "<div class=\"p-md border-width:1px border-style:solid b-line-divider r-sm bg-surface-raised\n            border-color-blue:has(:checked)\">\n  <label class=\"display:flex align-items:start gap-sm text-sm\">\n    <input type=\"checkbox\" class=\"mt-3xs accent-color-blue\n      outline-width:2px:focus-visible outline-style:solid:focus-visible outline-blue:focus-visible outline-offset:2px:focus-visible\" />\n    <span>Include project notes\n      <span class=\"display:block mt-2xs text-xs fg-text-muted\">The card border follows the checkbox.</span>\n    </span>\n  </label>\n</div>",
    caption: 'Check the option with a pointer or the Space key. :has(:checked) adds a border cue; the native checkbox carries the state.',
    guide: '/guide/compatibility#new-selectors',
  },
} satisfies Record<string, ProjectStyleExample>

export type ProjectStyleName = keyof typeof projectStyleExamples

export function projectStyleExample(name: string): ProjectStyleExample {
  if (!Object.hasOwn(projectStyleExamples, name)) throw new Error(`Unknown project style example: ${name}`)
  return projectStyleExamples[name as ProjectStyleName]
}
