export interface BlogArticleNeighbor {
  title: string
  description?: string
  category?: string
  date?: string
  pathname: string
  sourcePath?: string
}

/** Undated announcements lead the archive without inventing a publication date. */
export function compareBlogDates(a: { date?: string }, b: { date?: string }) {
  if (!a.date || !b.date) return Number(Boolean(a.date)) - Number(Boolean(b.date))
  return Date.parse(b.date) - Date.parse(a.date)
}

/**
 * The posts beside one post, newest first as on the blog index. A post that is not listed (a draft)
 * leads to the newest post.
 */
export function neighborsOf(sourcePath: string | undefined, categories: { pages: BlogArticleNeighbor[] }[]) {
  const ordered = categories
    .flatMap(({ pages }) => pages)
    .sort(compareBlogDates)
  const index = ordered.findIndex((post) => post.sourcePath === sourcePath)
  if (index < 0) return { newer: undefined, older: ordered[0] }
  return { newer: ordered[index - 1], older: ordered[index + 1] }
}
