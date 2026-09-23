import { configuredExampleCSS, configuredMarkupClasses } from '../reference/configured-example'

export const authoringSource = `@theme {
  --color-brand: #4f46e5;
  --color-text-action: var(--color-brand);
  --spacing-action-x: 1rem;
  --radius-action: 0.5rem;
}

@custom-variant motion-safe {
  @media (prefers-reduced-motion: no-preference) {
    @slot;
  }
}

@utilities {
  content-auto {
    content-visibility: auto;
    contain-intrinsic-size: auto 32rem;
  }
}

@components {
  btn {
    @compose inline-flex gap:xs items-center justify-center;
    @compose px:action-x py:xs r:action font:medium font:sm bg:brand fg:white;

    &:hover {
      @compose bg:brand/.85;
    }

    &:focus-visible {
      outline: 2px solid var(--color-brand);
      outline-offset: 3px;
    }
  }
}`

export const authoringHTML = `<article class="p:lg b:1px|solid|base r:lg content-auto">
  <h2 class="m:0 font:lg font:semibold">Project settings</h2>
  <p class="my:md text:muted">Shared tokens keep actions consistent across apps.</p>
  <button type="button" class="btn transition:background-color|fast|smooth@motion-safe">Save changes</button>
</article>`

export function authoringCSS() {
  return configuredExampleCSS(authoringSource, configuredMarkupClasses(authoringHTML))
}

export function authoringExampleMarkdown(part: string) {
  if (part === 'source') return `\`\`\`css name=master.css\n${authoringSource}\n\`\`\``
  if (part !== 'preview') throw new Error(`Unknown package example: ${part}`)
  return `\`\`\`html\n${authoringHTML}\n\`\`\`\n\nGenerated CSS:\n\n\`\`\`css\n${authoringCSS()}\n\`\`\``
}
