import { extractClassCandidates } from '../extract-class-candidates'

export function addClassString(
  classes: Set<string>,
  value: string | undefined | null,
  cache?: Map<string, string[]>
) {
  if (!value) return
  let classNames = cache?.get(value)
  if (!classNames) {
    classNames = extractClassCandidates(value)
    cache?.set(value, classNames)
  }
  for (const className of classNames) {
    if (className) classes.add(className)
  }
}
