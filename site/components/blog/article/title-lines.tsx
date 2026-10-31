/**
 * A "Subject: question" title breaks at its colon, never inside a phrase: each half becomes a span the stylesheet
 * sets on its own line(s). A full-width colon carries its own space, so none is added after it.
 */
export function titleLines(title: string, className: string) {
  const match = /^(.+?[:：])\s*(.+)$/.exec(title)
  if (!match) return title
  return <>
    <span className={className}>{match[1]}</span>
    {match[1].endsWith('：') ? null : ' '}
    <span className={className}>{match[2]}</span>
  </>
}
