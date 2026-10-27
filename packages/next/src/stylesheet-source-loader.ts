/** Transfer host-prepared CSS and its map through Webpack's importModule API. */
export default function stylesheetSourceLoader(source: string, sourceMap?: object | string, meta?: { ast?: { root?: { toJSON(): object } } }) {
  return `module.exports = ${JSON.stringify({ source, sourceMap: typeof sourceMap === 'string' ? sourceMap : sourceMap ? JSON.stringify(sourceMap) : undefined, ast: meta?.ast?.root?.toJSON() })}`
}
