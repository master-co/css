import { createRequire } from 'node:module'

/** Adapt generated resource names to Webpack's native CSS Modules syntax. */
export function preserveModuleGlobals(source: string, globals: string) {
  const require = createRequire(import.meta.url)
  // Use the host's parser, including its escaping and animation keyword tables.
  const { NodeType: T, parseAStylesheet } = require('webpack/lib/css/syntax')
  const { CSS_MODULES_KEYWORDS } = require('webpack/lib/css/data')
  const variables = new Set<string>(), animations = new Set<string>()
  const walkRules = (node: any, visit: (node: any) => void) => {
    visit(node)
    for (const child of node.type === T.Stylesheet ? node.rules : node.type === T.AtRule || node.type === T.QualifiedRule ? [...node.declarations ?? [], ...node.childRules ?? []] : []) walkRules(child, visit)
  }
  walkRules(parseAStylesheet(globals), node => {
    if (node.type === T.Declaration && node.name.startsWith('--')) variables.add(node.unescapedName)
    if (node.type === T.AtRule && /keyframes$/i.test(node.name)) {
      const name = node.prelude.find((part: any) => part.type === T.Ident || part.type === T.String)
      if (name) animations.add(name.unescaped)
    }
  })
  const edits: { start: number, end: number, value: string }[] = []
  const add = (start: number, end: number, value: string) => edits.push({ start, end, value })
  const values = (node: any) => {
    const children = node.value
    if (node.type === T.Function && node.name.toLowerCase() === 'var') {
      const parts = children.filter((part: any) => part.type !== T.Whitespace && part.type !== T.Comment)
      const name = parts[0]
      if (name && name.type === T.Ident && variables.has(name.unescaped)
        && (!parts[1] || parts[1].type === T.Comma)) add(name.end, name.end, ' from global')
    }
    for (const child of children) if (child.type === T.Function || child.type === T.SimpleBlock) values(child)
  }
  walkRules(parseAStylesheet(source), node => {
    if (node.type !== T.Declaration) return
    if (variables.has(node.unescapedName)) add(node.nameEnd, node.nameEnd, ' from global')
    values(node)
    const property = node.name.toLowerCase().replace(/^-webkit-/, '')
    if (property !== 'animation' && property !== 'animation-name') return
    const keywords = CSS_MODULES_KEYWORDS.get(property)
    for (const part of node.value) {
      if (part.type !== T.Ident && part.type !== T.String) continue
      const name = part.unescaped
      if (!animations.has(name) || (part.type === T.Ident && keywords.has(name.toLowerCase()))) continue
      const start = part.start, end = part.end
      // Keep the declaration colon separate from the host's :global() spelling.
      add(start, end, ` global(${source.slice(start, end)})`)
    }
  })
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.value + source.slice(edit.end)
  return source
}
