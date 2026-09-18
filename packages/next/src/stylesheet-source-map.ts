import { pathToFileURL } from 'node:url'

/** Shift prepared mappings for the single synthetic package-import line. */
export function prependStylesheetLineMap(file: string, source: string, sourceMap?: string) {
  if (sourceMap) {
    const map = JSON.parse(sourceMap)
    return JSON.stringify({ ...map, mappings: ';' + map.mappings })
  }
  const lines = source.split(/\r\n?|\n/)
  return JSON.stringify({ version: 3, sources: [pathToFileURL(file).href], sourcesContent: [source], names: [],
    mappings: ';' + lines.map((_, index) => index ? 'AACA' : 'AAAA').join(';') })
}
