import { readFileSync } from 'node:fs'
import { parse as parseAstro } from '@astrojs/compiler-rs'
import { parse as parseSvelte } from 'svelte/compiler'
import { parse as parseTypeScript } from '@typescript-eslint/parser'
import { parseExpressionAt } from 'acorn'

/** A user-facing string in a component: template text, a translatable attribute or a data property. */
export interface ComponentText {
  line: number
  /** `text`, the attribute name, or the property name. */
  kind: string
  text: string
}

export interface ComponentTextOptions {
  attributes: ReadonlySet<string>
  properties: ReadonlySet<string>
}

export function isComponentFile(file: string) {
  return file.endsWith('.astro') || file.endsWith('.svelte') || file.endsWith('.ts')
}

/** Literal calls cover interface copy stored outside component templates. */
export function translationKeys(source: string): string[] {
  const keys = new Set<string>()
  for (const match of source.matchAll(/\bt\(\s*(?=['"`])/g)) {
    const start = match.index! + match[0].length
    try {
      const node = parseExpressionAt(source, start, { ecmaVersion: 'latest' }) as any
      if (node.type === 'Literal' && typeof node.value === 'string') keys.add(node.value)
      if (node.type === 'TemplateLiteral' && node.expressions.length === 0) keys.add(node.quasis[0].value.cooked)
    } catch { /* Dynamic expressions are supplied by their owning data catalog. */ }
  }
  return [...keys]
}

/** Literal UI strings of an `.astro` or `.svelte` component, in source order. */
export function componentTexts(file: string, options: ComponentTextOptions): ComponentText[] {
  const source = readFileSync(file, 'utf8')
  const texts: ComponentText[] = []
  const lineOf = (offset: number) => source.slice(0, offset).split('\n').length
  const add = (offset: number, kind: string, text: unknown) => {
    if (typeof text === 'string') texts.push({ line: lineOf(offset), kind, text })
  }
  const literal = (node: any): string | undefined => {
    if (node?.type === 'Literal' && typeof node.value === 'string') return node.value
    if (node?.type === 'TemplateLiteral' && !node.expressions.length) return node.quasis[0]?.value.cooked
  }
  const visit = (node: any, inTemplate: boolean) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach((child) => visit(child, inTemplate))
    switch (node.type) {
      // Astro templates parse as JSX; Svelte templates as `Text` outside attribute values.
      case 'JSXText':
        return add(node.start ?? node.range?.[0] ?? 0, 'text', node.value)
      case 'Text':
        if (inTemplate) add(node.start ?? node.range?.[0] ?? 0, 'text', node.data)
        return
      case 'JSXAttribute': {
        const name = node.name?.name
        if (options.attributes.has(name)) add(node.start ?? node.range?.[0] ?? 0, name, literal(node.value))
        break
      }
      case 'Attribute': {
        if (options.attributes.has(node.name) && Array.isArray(node.value) && node.value.length === 1 && node.value[0].type === 'Text') {
          add(node.start ?? node.range?.[0] ?? 0, node.name, node.value[0].data)
        }
        return visit(Array.isArray(node.value) ? node.value.filter((part: any) => part.type !== 'Text') : node.value, false)
      }
      case 'Property': {
        const name = node.key?.name ?? node.key?.value
        if (!node.computed && options.properties.has(name)) add(node.start ?? node.range?.[0] ?? 0, name, literal(node.value))
        break
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'name_loc' || key === 'metadata') continue
      visit(value, inTemplate && key !== 'expression' && key !== 'content')
    }
  }
  if (file.endsWith('.astro')) {
    visit(parseAstro(source).ast, false)
  } else if (file.endsWith('.svelte')) {
    const ast = parseSvelte(source, { modern: true, filename: file })
    visit(ast.module?.content, false)
    visit(ast.instance?.content, false)
    visit(ast.fragment, true)
  } else {
    visit(parseTypeScript(source, { range: true, loc: true, sourceType: 'module' }), false)
  }
  return texts.sort((a, b) => a.line - b.line)
}
