export interface BlogArticleNeighbor {
  title: string
  description?: string
  category?: string
  date: string
  pathname: string
  sourcePath?: string
}

/**
 * The posts beside one post, newest first as on the blog index. A post that is not listed (a draft)
 * leads to the newest post.
 */
export function neighborsOf(sourcePath: string | undefined, categories: { pages: BlogArticleNeighbor[] }[]) {
  const ordered = categories
    .flatMap(({ pages }) => pages)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  const index = ordered.findIndex((post) => post.sourcePath === sourcePath)
  if (index < 0) return { newer: undefined, older: ordered[0] }
  return { newer: ordered[index - 1], older: ordered[index + 1] }
}
