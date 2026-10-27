import { MasterCSSError } from '@master/css-schema'
import { extractClassCandidatesNative as extractClassCandidates } from '../native'
import { extractOxcClasses } from './oxc'
import { loadOptionalPeer } from './optional-peer'
import type { SourceAdapter, SourceAdapterInput } from './types'

type VueCompilerSFC = {
  parse: typeof import('vue/compiler-sfc')['parse']
}

export const VUE_SOURCE_EXT = /\.vue(?:\?|$)/

function isVueSource(source: string) {
  return VUE_SOURCE_EXT.test(source) && !/[?&]type=style(?:&|$)/.test(source)
}

function add(classes: Set<string>, classNames: string[]) {
  for (const className of classNames) {
    if (className) classes.add(className)
  }
}

async function loadVueCompiler() {
  const specifier = ['vue', '/compiler-sfc'].join('')
  return await loadOptionalPeer<VueCompilerSFC>(specifier, 'Vue SFC')
}

export async function extractVueClasses(source: string, content: string): Promise<string[]> {
  if (!content.trim()) return []
  const compiler = await loadVueCompiler()
  if (!compiler) throw new MasterCSSError({ code: 'SOURCE_PARSE_ERROR', domain: 'tooling', message: `Cannot parse ${source}: install the framework compiler or explicitly select kind: 'raw'.` })

  try {
    const classes = new Set<string>()
    const { descriptor, errors } = compiler.parse(content, { filename: source })
    if (errors.length) throw new Error(errors.map(String).join("; "))

    if (descriptor.template?.content) {
      add(classes, extractClassCandidates(descriptor.template.content))
    }
    if (descriptor.script?.content) {
      add(classes, extractOxcClasses(`${source}.${descriptor.script.lang || 'js'}`, descriptor.script.content))
    }
    if (descriptor.scriptSetup?.content) {
      add(classes, extractOxcClasses(`${source}.${descriptor.scriptSetup.lang || 'js'}`, descriptor.scriptSetup.content))
    }

    return [...classes]
  } catch (error) {
    throw new MasterCSSError({ code: 'SOURCE_PARSE_ERROR', domain: 'tooling', message: `Cannot parse ${source}: ${String(error)}` }, { cause: error })
  }
}

export function vueAdapter(): SourceAdapter {
  return {
    name: 'vue',
    test: isVueSource,
    async extract({ source, content }: SourceAdapterInput) {
      return await extractVueClasses(source, content)
    }
  }
}
