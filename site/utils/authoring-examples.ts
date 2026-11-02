import { configuredExampleCSS, configuredMarkupClasses } from '@master/internal-site/css/configured-example.ts'

export const authoringSource = `@theme {
  --color-brand: #4f46e5;
  --color-text-action: var(--color-text-strong);
  --color-focus-action: var(--color-text-strong);
  --spacing-action-x: 1rem;
  --radius-action: 0.375rem;
}

@custom-media --theme-motion (prefers-reduced-motion: no-preference);

@utility content-auto {
  content-visibility: auto;
  contain-intrinsic-size: auto 32rem;
}

@layer components {
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    min-height: 2.375rem;
    max-width: 100%;
    padding: .5rem var(--spacing-action-x);
    border: 1px solid var(--color-line-divider);
    border-radius: var(--radius-action);
    font-size: var(--font-size-sm);
    font-weight: 400;
    line-height: 1.2;
    background-color: var(--color-surface-raised);
    color: var(--color-text-action);
    box-shadow: var(--shadow-sm);

    &:hover {
      box-shadow: var(--shadow-md);
    }

    &:active {
      background-color: var(--color-surface-inset);
      box-shadow: none;
    }

    &:focus-visible {
      outline: 2px solid var(--color-focus-action);
      outline-offset: 3px;
    }
  }
}`

export const authoringHTML = `<article class="p-lg b-solid b(1) b-line-divider r-lg content-auto">
  <p class="flex items-center gap-xs m(0) text-xs fg-text-muted"><span aria-hidden="true" class="h(8) w(8) pill bg-brand"></span>Package brand</p>
  <h2 class="mb-xs mt-sm text-lg font-regular">Shared vocabulary</h2>
  <p class="mt(0) mb-md text-sm fg-text-muted">The app supplies the markup; the package supplies the shared action.</p>
  <button type="button" class="btn (transition-property:box-shadow,background-color)@theme-motion (transition-duration:var(--duration-fast))@theme-motion (transition-timing-function:var(--easing-smooth))@theme-motion">Preview action</button>
</article>`

export function authoringCSS() {
  return configuredExampleCSS(authoringSource, configuredMarkupClasses(authoringHTML))
}

export function authoringExampleMarkdown(part: string) {
  if (part === 'source') return `\`\`\`css name=master.css\n${authoringSource}\n\`\`\``
  if (part !== 'preview') throw new Error(`Unknown package example: ${part}`)
  return `\`\`\`html\n${authoringHTML}\n\`\`\`\n\nGenerated CSS:\n\n\`\`\`css disclosure=generated-css\n${authoringCSS()}\n\`\`\``
}
