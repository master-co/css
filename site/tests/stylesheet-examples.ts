/** Read only the literal source form supported by the stylesheet specimens. */
export function stylesheetExamples(source: string) {
  return [...source.matchAll(/<StylesheetExample\s+title="([^"]+)"\s+source=\{("(?:\\.|[^"\\])*")\}\s*\/>/g)].map(match => ({
    title: match[1], source: JSON.parse(match[2]) as string,
    range: [match.index, match.index + match[0].length] as [number, number],
  }))
}
