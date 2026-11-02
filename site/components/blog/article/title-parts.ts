/**
 * A "Subject: question" title breaks at its colon, never inside a phrase: each half becomes a span the stylesheet
 * sets on its own line(s). A full-width colon carries its own space, so none is added after it.
 */
export function titleParts(title: string) {
  const match = /^(.+?[:：])\s*(.+)$/.exec(title)
  if (!match) return undefined
  return { first: match[1], space: !match[1].endsWith('：'), second: match[2] }
}
