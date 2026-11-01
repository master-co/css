/** Sections with the subsections that follow them, as nested contents lists; a subsection before any section stands on its own. */
export default function groupPageContent<T extends { level: number }>(items: T[]) {
  const groups: { item: T, children: T[] }[] = []
  for (const item of items) {
    const parent = groups[groups.length - 1]
    if (item.level === 3 && parent?.item.level === 2) parent.children.push(item)
    else groups.push({ item, children: [] })
  }
  return groups
}
