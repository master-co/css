/**
 * Astro scopes stylesheets of modules imported with `?astroPropagatedAssets` to
 * the render that uses them, as it does for content collection entries. Every
 * page of the `[...path]` route would otherwise receive the CSS of all content.
 * Keep this private Astro contract here: import modules only through `getMod()`.
 */
export interface PropagatedModule<T> {
  getMod(): Promise<T>
  collectedLinks: string[]
  /** Built CSS text, or dev-time `{ id, content }` records. */
  collectedStyles: (string | { id: string, content: string })[]
}

export interface PageAssets {
  links: string[]
  styles: string[]
}

export const propagatedAssetsQuery = '?astroPropagatedAssets'

export function mergeAssets(...modules: PropagatedModule<unknown>[]): PageAssets {
  const links = new Set<string>()
  const styles = new Set<string>()
  for (const module of modules) {
    module.collectedLinks.forEach((link) => links.add(link))
    module.collectedStyles.forEach((style) => styles.add(typeof style === 'string' ? style : style.content))
  }
  return { links: [...links], styles: [...styles] }
}
