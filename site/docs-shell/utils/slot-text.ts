const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" }

interface Slots {
  has(name: string): boolean
  render(name: string): Promise<string>
}

/**
 * The text an Astro component received as a slot, such as the source in
 * `<Code lang="html">{`<div>`}</Code>`. Astro escapes text children; this restores them.
 */
export async function slotText(slots: Slots, name = 'default') {
  if (!slots.has(name)) return undefined
  return (await slots.render(name)).replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (entity) => entities[entity])
}
