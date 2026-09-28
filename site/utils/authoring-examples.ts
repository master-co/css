import { configuredExampleCSS, configuredMarkupClasses } from '../reference/configured-example'

export const authoringSource = "@theme { :root, :host {\n  --color-brand: #4f46e5;\n  --color-text-action: var(--color-brand);\n  --spacing-action-x: 1rem;\n  --radius-action: 0.5rem;\n} }\n\n\n@custom-variant motion-safe {\n  @media (prefers-reduced-motion: no-preference) {\n    @slot;\n  }\n}\n\n@utility content-auto {\n    content-visibility: auto;\n    contain-intrinsic-size: auto 32rem;\n  }\n\n@layer components {\n  .btn {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    gap: var(--spacing-xs);\n    padding: var(--spacing-xs) var(--spacing-action-x);\n    border-radius: var(--radius-action);\n    font-size: var(--font-size-sm);\n    font-weight: 500;\n    background-color: var(--color-brand);\n    color: var(--color-white);\n\n    &:hover {\n      background-color: color-mix(in oklab, var(--color-brand) 85%, transparent);\n    }\n\n    &:focus-visible {\n      outline: 2px solid var(--color-brand);\n      outline-offset: 3px;\n    }\n  }\n}"

export const authoringHTML = `<article class="p-lg b:1px|solid|var(--color-line-divider) r-lg content-auto">
  <h2 class="m:0 font-lg font-semibold">Project settings</h2>
  <p class="my-md text-muted">Shared tokens keep actions consistent across apps.</p>
  <button type="button" class="btn transition:background-color|var(--duration-fast)|var(--easing-smooth)@motion-safe">Save changes</button>
</article>`

export function authoringCSS() {
  return configuredExampleCSS(authoringSource, configuredMarkupClasses(authoringHTML))
}

export function authoringExampleMarkdown(part: string) {
  if (part === 'source') return `\`\`\`css name=master.css\n${authoringSource}\n\`\`\``
  if (part !== 'preview') throw new Error(`Unknown package example: ${part}`)
  return `\`\`\`html\n${authoringHTML}\n\`\`\`\n\nGenerated CSS:\n\n\`\`\`css\n${authoringCSS()}\n\`\`\``
}
