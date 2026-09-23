import { readFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxjsEsm } from 'micromark-extension-mdxjs-esm'
import { mdxjsEsmFromMarkdown } from 'mdast-util-mdxjs-esm'
import { mdxJsx } from 'micromark-extension-mdx-jsx'
import { mdxJsxFromMarkdown } from 'mdast-util-mdx-jsx'
import * as acorn from 'acorn'
import { generatePresetCSS } from '../common/generate-preset-css'
import type { ReferenceExample, SyntaxRow } from './types'
import { tokenValuesMarkdown } from './TokenValues'
import { getVariableNamespacePublicKeys } from '../utils/manifest-utilities'
import { variableNamespaceSourcesMarkdown } from '../utils/variable-namespace-sources'
import { configuredExampleCSS, configuredExampleHTML, configuredMarkupClasses, configuredMarkupMarkdown } from './configured-example'
import { stylesheetExampleMarkdown } from './stylesheet-example'

export function syntaxMarkdown(rows: SyntaxRow[]) {
  return rows.map(row => `### \`${row.syntax}\` {#${row.id}}\n\n\`\`\`css\n${row.declarations}\n\`\`\``).join('\n\n')
}

export function portableMarkdown(markdown: string) {
  return markdown.split(/(```[\s\S]*?```)/g).map(part => part.startsWith('```') ? part : part.replace(/^(#{2,3}) (.+) \{#([\w-]+)\}$/gm, '<a id="$3"></a>\n\n$1 $2')).join('')
}

/** Resolve authored literals only. Never execute MDX expressions to extract documents. */
function literal(node: any, variables: Record<string, unknown>): unknown {
  if (node.type === 'Literal') return node.value
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map((property: any) => {
    if (property.type !== 'Property' || property.computed || property.method || property.kind !== 'init') throw new Error('Only literal document properties are supported')
    return [property.key.name ?? property.key.value, literal(property.value, variables)]
  }))
  if (node.type === 'ArrayExpression') return node.elements.map((item: any) => literal(item, variables))
  if (node.type === 'Identifier' && node.name in variables) return variables[node.name]
  if (node.type === 'TemplateLiteral' && !node.expressions.length) return node.quasis[0].value.cooked
  throw new Error(`Unsupported document expression: ${node.type}`)
}

export interface MdxContentOptions {
  /** Reference Overview renders syntax rows; Guide Overview may be a local MDX include. */
  overview?: 'syntax' | 'include'
  component?: (name: string, attributes: Record<string, unknown>, file: string) => string | undefined
}

export async function extractReferenceMdx(file: string, rows: SyntaxRow[] = [], stack: string[] = [], options: MdxContentOptions = {}) {
  if (stack.includes(file)) throw new Error(`Recursive document include: ${file}`)
  const expressions: Record<string, string> = {}
  const source = (await readFile(file, 'utf8')).split(/(```[\s\S]*?```)/g).map(part => part.startsWith('```') ? part : part.replace(/\{?<Demo\b[\s\S]*?<\/Demo>\}?/g, '').replace(/(<(?:Code|Class2CSS)\b[^>]*>)([\s\S]*?)(<\/(?:Code|Class2CSS)>)/g, (_, start, expression, end) => { const key = `MCSS_EXPRESSION_${Object.keys(expressions).length}`; expressions[key] = expression; return `${start}\n${key}\n${end}` })).join('')
  const examples: ReferenceExample[] = []
  const notes: string[] = []
  const variables: Record<string, unknown> = {}
  const imports: Record<string, string> = {}
  let tree: any
  try { tree = fromMarkdown(source, {
    extensions: [{ disable: { null: ['htmlFlow', 'htmlText', 'codeIndented'] } }, mdxjsEsm({ acorn, addResult: true }), mdxJsx({ acorn, addResult: true })],
    mdastExtensions: [mdxjsEsmFromMarkdown(), mdxJsxFromMarkdown()]
  }) } catch (error) { throw new Error(`Cannot parse ${file}`, { cause: error }) }
  const raw = (node: any) => source.slice(node.position.start.offset, node.position.end.offset)
  const collectEsm = (node: any) => {
    if (node.type === 'mdxjsEsm') {
      const program = node.data?.estree ?? acorn.parse(node.value, { ecmaVersion: 'latest', sourceType: 'module' })
      for (const statement of program.body) {
        if (statement.type === 'ImportDeclaration') {
          for (const specifier of statement.specifiers) imports[specifier.local.name] = statement.source.value
        }
        const declaration = statement.declaration ?? statement
        if (declaration.type === 'VariableDeclaration') {
          for (const item of declaration.declarations) {
            try { variables[item.id.name] = literal(item.init, variables) } catch { /* only literal snippets are exportable */ }
          }
        }
      }
    }
    node.children?.forEach(collectEsm)
  }
  collectEsm(tree)
  const expression = async (text: string) => {
    const value = (expressions[text.trim()] ?? text).trim().replace(/^\{([\s\S]*)\}$/, '$1').trim()
    const requireMatch = value.match(/^require\(['"](.+?)\?raw['"]\)$/)
    if (requireMatch) {
      const target = path.resolve(path.dirname(file), requireMatch[1])
      if (!target.startsWith(path.resolve(path.dirname(file)) + path.sep)) throw new Error('Raw include must be package local')
      return readFile(target, 'utf8')
    }
    return literal(acorn.parseExpressionAt(value, 0, { ecmaVersion: 'latest' }), variables)
  }
  async function render(node: any): Promise<string> {
    if (node.type === 'mdxjsEsm') return ''
    if (node.type === 'code') return `\`\`\`${node.lang ?? ''}${node.meta ? ` ${node.meta}` : ''}\n${node.value}\n\`\`\``
    if (node.type === 'inlineCode') return raw(node)
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      const name = node.name ?? ''
      const attrs: Record<string, any> = Object.fromEntries((node.attributes ?? []).filter((a: any) => a.name).map((a: any) => [a.name, a.value]))
      const inner = (node.children ?? []).map(raw).join('\n')
      const adapted = options.component?.(name, attrs, file)
      if (adapted !== undefined) return adapted
      if (name === 'Overview' && options.overview !== 'include') return syntaxMarkdown(rows)
      if (name === 'StylesheetExample') {
        const source = typeof attrs.source === 'string' ? attrs.source : await expression(attrs.source.value)
        if (typeof attrs.title !== 'string' || typeof source !== 'string') throw new Error('StylesheetExample requires a literal title and source')
        return stylesheetExampleMarkdown(attrs.title, source)
      }
      if (name === 'TokenValues') return tokenValuesMarkdown(attrs.namespace, await expression(attrs.keys.value) as string[])
      if (name === 'DemoConfiguredExample') {
        const configuration = typeof attrs.source === 'string' ? attrs.source : await expression(attrs.source.value) as string
        const html = typeof attrs.html === 'string' ? attrs.html : await expression(attrs.html.value) as string
        return `${configuredMarkupMarkdown(configuration, html)}${typeof attrs.caption === 'string' ? `\n\n${attrs.caption}` : ''}`
      }
      if (name === 'ConfiguredExample') {
        const configuration = typeof attrs.source === 'string' ? attrs.source : await expression(attrs.source.value) as string
        const html = attrs.html !== undefined ? typeof attrs.html === 'string' ? attrs.html : await expression(attrs.html.value) as string : undefined
        const classes = html !== undefined ? configuredMarkupClasses(html) : await expression(attrs.classes.value) as string[]
        const css = configuredExampleCSS(configuration, classes)
        examples.push({ id: `example-${examples.length + 1}`, title: classes.join(' '), classes, configuration, css })
        return `${configuration ? `\`\`\`css\n${configuration}\n\`\`\`\n\n` : ''}\`\`\`html\n${html ?? configuredExampleHTML(classes, attrs.element ?? 'div', attrs.label ?? 'Example')}\n\`\`\`\n\n\`\`\`css\n${css}\n\`\`\``
      }
      if (name === 'TextHeirs') return getVariableNamespacePublicKeys('color-text').map(key => `\`${key}:\``).join(', ')
      if (name === 'VariableNamespaceSources') return variableNamespaceSourcesMarkdown()
      if (name === 'LayersDefault') return 'The base stylesheet declares `@layer theme, base, defaults, components, utilities;`. Theme tokens, base rules, defaults, component definitions and utilities are emitted in their corresponding layers. See the examples below for their interactions.'
      if (name === 'StartingStyleExample' || name === 'AnimationDirectionBasicDemo') return '' // Visual demos accompany the adjacent complete code examples.
      if (name === 'Class2CSS') {
        const value = await expression(inner)
        const classes = (Array.isArray(value) ? value : [value]).flatMap(item => String(item).split(/\s+/)).filter(Boolean)
        const css = generatePresetCSS(classes)
        examples.push({ id: `example-${examples.length + 1}`, title: classes.join(' '), classes, css })
        return `\`\`\`css\n${css}\n\`\`\``
      }
      if (name === 'Code') {
        try { return `\`\`\`${typeof attrs.lang === 'string' ? attrs.lang : ''}\n${await expression(inner)}\n\`\`\`` }
        catch { notes.push(`${path.basename(file)}: Code expression requires a text equivalent`); return '' }
      }
      if (name === 'Basic' && typeof attrs.className === 'string') return `\`\`\`html\n<div class="${attrs.className}">…</div>\n\`\`\``
      if (name === 'DemoIndex') {
        const groups = await expression(attrs.groups.value) as { title: string, links: { href: string, label: string }[] }[]
        if (!Array.isArray(groups) || groups.some(group => !group || typeof group.title !== 'string' || !Array.isArray(group.links)
          || group.links.some(link => !link || typeof link.href !== 'string' || typeof link.label !== 'string'))) throw new Error('DemoIndex requires literal group titles and labeled links')
        return groups.map(group => `**${group.title}**\n\n${group.links.map(link => `- [${link.label}](${link.href})`).join('\n')}`).join('\n\n')
      }
      if (/^(Demo|DemoPanel|Image|InteractingIndicator|Dropped|Icon\w+)/.test(name) || name === 'HelloWorld') return ''
      if (name === 'DocumentChoices') {
        const entries = await expression(attrs.entries.value) as { title: string, href: string, description: string }[]
        if (!Array.isArray(entries) || entries.some(entry => !['title', 'href', 'description'].every(key => typeof entry[key as keyof typeof entry] === 'string'))) throw new Error('DocumentChoices requires literal titles, links and descriptions')
        return entries.map(entry => `- [${entry.title}](${entry.href}) — ${entry.description}`).join('\n')
      }
      if (name === 'DocumentOptionEntry') {
        if (typeof attrs.name !== 'string') throw new Error('DocumentOptionEntry requires a literal name')
        return `**\`${attrs.name}\`**\n\n${(await Promise.all((node.children ?? []).map(render))).join('\n\n')}`
      }
      if (name === 'StepNum' || name === 'DocumentStepNumber') return ''
      if (['DocumentOptionList', 'DocumentComparison', 'StepSection', 'Step', 'StepL', 'StepR', 'StepEnd', 'CodeTabs', 'Tab', 'DocumentSteps', 'DocumentStep', 'DocumentStepText', 'DocumentStepBody'].includes(name)) return (await Promise.all((node.children ?? []).map(render))).join('\n\n')
      if (/^[A-Z]/.test(name)) {
        const imported = imports[name]
        const siteRoot = file.slice(0, file.indexOf('/app/'))
        const target = imported?.startsWith('~/site/') ? path.join(siteRoot, imported.slice(7))
          : imported?.startsWith('.') ? path.resolve(path.dirname(file), imported)
            : path.join(path.dirname(file), 'components', `${name}.mdx`)
        if (target.endsWith('.mdx') && await access(target).then(() => true, () => false)) {
          const result = await extractReferenceMdx(target, rows, [...stack, file], options)
          examples.push(...result.examples)
          notes.push(...result.notes)
          return result.markdown
        }
        notes.push(`${path.basename(file)}: ${name} has no Markdown adapter`)
      }
      if (name === 'a' && attrs.id) return `<a id="${attrs.id}"></a>`
      return (await Promise.all((node.children ?? []).map(render))).join(name === 'details' ? '\n\n' : '')
    }
    if (!node.children?.length) return raw(node)
    // Replace only MDX descendants, preserving Markdown punctuation and fenced examples.
    let text = raw(node)
    for (const child of [...node.children].reverse()) {
      const start = child.position.start.offset - node.position.start.offset
      const end = child.position.end.offset - node.position.start.offset
      text = text.slice(0, start) + await render(child) + text.slice(end)
    }
    return node.type === 'heading' ? text.replace(/\\([{}])/g, '$1') : text
  }
  const parts: string[] = []
  for (const child of tree.children) parts.push(await render(child))
  const markdown = parts.join('\n\n').split(/(```[\s\S]*?```)/g).map(part => part.startsWith('```') ? part : part.replace(/\{?\/\*\s*eslint-[\s\S]*?\*\/\}?/g, '')).join('')
    .replace(/ \[sr-only\]/g, '').replace(/<!--\s*@MARK[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n').trim()
  return { markdown, examples, notes: [...new Set(notes)] }
}
