import { MasterCSSError } from '@master/css-schema'
import { extractClassCandidatesNative as extractClassCandidates } from '../native'
import { extractOxcClasses } from './oxc'
import { loadOptionalPeer } from './optional-peer'
import type { SourceAdapter, SourceAdapterInput } from './types'

type SvelteCompiler = {
  parse: typeof import('svelte/compiler')['parse']
}

interface SvelteRange {
  start?: number
  end?: number
}

interface SvelteScript extends SvelteRange {
  content?: SvelteRange
}

interface SvelteAttributeValue extends SvelteRange {
  type?: string
  data?: string
  raw?: string
}

interface SvelteAttribute {
  type?: string
  name?: string
  value?: SvelteAttributeValue[]
  expression?: SvelteRange
}

interface SvelteMarkupNode {
  attributes?: SvelteAttribute[]
  children?: SvelteMarkupNode[]
  else?: SvelteMarkupNode
  pending?: SvelteMarkupNode
  then?: SvelteMarkupNode
  catch?: SvelteMarkupNode
}

export const SVELTE_SOURCE_EXT = /\.svelte(?:\?|$)/

function isSvelteSource(source: string) {
  return SVELTE_SOURCE_EXT.test(source) && !/[?&]type=style(?:&|$)/.test(source)
}

function addClassString(classes: Set<string>, value: string | undefined) {
  if (!value) return
  for (const className of extractClassCandidates(value)) {
    if (className) classes.add(className)
  }
}

function addOxc(classes: Set<string>, source: string, content: string) {
  for (const className of extractOxcClasses(source, content)) {
    if (className) classes.add(className)
  }
}

function scriptExtension(content: string, script: SvelteScript | undefined): 'js' | 'ts' | 'tsx' {
  if (script?.start == null || script.content?.start == null) return 'js'
  const openingTag = content.slice(script.start, script.content.start)
  const match = /(?:^|\s)lang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/iu.exec(openingTag)
  const language = (match?.[1] ?? match?.[2] ?? match?.[3])?.toLowerCase()
  return language === 'ts' || language === 'tsx' ? language : 'js'
}

function visitMarkup(node: SvelteMarkupNode | undefined, source: string, content: string, classes: Set<string>, extension: 'js' | 'ts' | 'tsx') {
  if (!node || typeof node !== 'object') return

  if (Array.isArray(node.attributes)) {
    for (const attribute of node.attributes) {
      if (attribute.type === 'Class') {
        addClassString(classes, attribute.name)
        if (attribute.expression?.start != null && attribute.expression?.end != null) {
          addOxc(classes, `${source}.${extension}`, content.slice(attribute.expression.start, attribute.expression.end))
        }
        continue
      }
      if (attribute.type !== 'Attribute' || attribute.name !== 'class') continue
      for (const value of attribute.value || []) {
        if (value.type === 'Text') {
          addClassString(classes, value.data ?? value.raw)
        } else if (value.start != null && value.end != null) {
          addOxc(classes, `${source}.${extension}`, content.slice(value.start, value.end))
        }
      }
    }
  }

  for (const child of node.children || []) {
    visitMarkup(child, source, content, classes, extension)
  }
  for (const branch of [node.else, node.pending, node.then, node.catch]) {
    visitMarkup(branch, source, content, classes, extension)
  }
}

async function loadSvelteCompiler() {
  const specifier = ['svelte', '/compiler'].join('')
  return await loadOptionalPeer<SvelteCompiler>(specifier, 'Svelte')
}

export async function extractSvelteClasses(source: string, content: string): Promise<string[]> {
  if (!content.trim()) return []
  const compiler = await loadSvelteCompiler()
  if (!compiler) throw new MasterCSSError({ code: 'SOURCE_PARSE_ERROR', domain: 'tooling', message: `Cannot parse ${source}: install the framework compiler or explicitly select kind: 'raw'.` })

  try {
    const ast = compiler.parse(content)
    const classes = new Set<string>()
    const moduleExtension = scriptExtension(content, ast.module)
    const instanceExtension = scriptExtension(content, ast.instance)

    if (ast.module?.content) {
      addOxc(classes, `${source}.${moduleExtension}`, content.slice(ast.module.content.start, ast.module.content.end))
    }
    if (ast.instance?.content) {
      addOxc(classes, `${source}.${instanceExtension}`, content.slice(ast.instance.content.start, ast.instance.content.end))
    }
    visitMarkup(ast.html as SvelteMarkupNode, source, content, classes,
      moduleExtension === 'tsx' || instanceExtension === 'tsx' ? 'tsx' : moduleExtension === 'ts' || instanceExtension === 'ts' ? 'ts' : 'js')

    return [...classes]
  } catch (error) {
    throw new MasterCSSError({ code: 'SOURCE_PARSE_ERROR', domain: 'tooling', message: `Cannot parse ${source}: ${String(error)}` }, { cause: error })
  }
}

export function svelteAdapter(): SourceAdapter {
  return {
    name: 'svelte',
    test: isSvelteSource,
    async extract({ source, content }: SourceAdapterInput) {
      return await extractSvelteClasses(source, content)
    }
  }
}
