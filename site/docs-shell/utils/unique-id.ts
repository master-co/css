const counters = new WeakMap<Request, number>()

/**
 * A page-unique, deterministic id for an Astro component, like React's `useId`:
 * `const id = uniqueId(Astro, 'code-tabs')`. Svelte components use `$props.id()`.
 */
export function uniqueId(astro: { request: Request }, prefix = 'id') {
  const index = counters.get(astro.request) ?? 0
  counters.set(astro.request, index + 1)
  return `${prefix}-${index}`
}
