import { createRequire } from 'node:module'
import { dirname, relative, sep } from 'node:path'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { PostCSSResourceHook } from './postcss-request-plugins'

export interface NextPostCSSResourcePolicy {
  file: string
  projectDir: string
  manifest: MasterCSSManifest
  /** Processing history, not an inventory of declarations surviving user edits. */
  processedGlobals: MasterCSSEmittedGlobals
  resourceFiles: readonly (readonly [string, string])[]
}
interface Root {
  toString(): string
  append(nodes: unknown): void
  masterCSSProcessedGlobals?: MasterCSSEmittedGlobals
}
function hostParsers() {
  const require = createRequire(import.meta.url)
  const nextRequire = createRequire(require.resolve('next/package.json'))
  return { postcss: nextRequire('postcss'), parseValue: nextRequire('next/dist/compiled/postcss-value-parser') }
}

/** Rebase only identities allocated by compiler delivery; Next parses the tokens. */
export function rebasePostCSSResources(source: string, file: string, resourceFiles: readonly (readonly [string, string])[]) {
  const { postcss, parseValue } = hostParsers()
  const resources = new Map(resourceFiles)
  const root = postcss.parse(source, { from: file })
  root.walkDecls((decl: { value: string }) => {
    const value = parseValue(decl.value)
    value.walk((node: { type: string, value: string, nodes?: { type: string, value: string }[] }) => {
      if (node.type !== 'function' || node.value.toLowerCase() !== 'url') return
      const tokens = node.nodes?.filter(token => token.type !== 'space' && token.type !== 'comment')
      if (tokens?.length !== 1 || !['string', 'word'].includes(tokens[0].type) || !tokens[0].value.startsWith('file:')) return false
      const url = new URL(tokens[0].value)
      const suffix = url.search + url.hash
      url.search = '';url.hash = ''
      const target = resources.get(url.href)
      if (target) tokens[0].value = './' + relative(dirname(file), target).split(sep).map(encodeURIComponent).join('/') + suffix
      return false
    })
    decl.value = value.toString()
  })
  return root.toString() as string
}

/** Each resource enters the user pipeline once, including resources later deleted by it. */
export function createNextPostCSSResourceHook(policy: NextPostCSSResourcePolicy): PostCSSResourceHook {
  const { postcss } = hostParsers()
  const histories = new WeakMap<object, MasterCSSEmittedGlobals>()
  return async node => {
    const root = node as Root
    const processedGlobals = histories.get(root) ?? policy.processedGlobals
    const rendered = await compileRenderedStylesheet(policy.file, root.toString(), {
      projectDir: policy.projectDir, baseManifest: policy.manifest, emittedGlobals: processedGlobals
    })
    if (rendered.generatedCSS) {
      const css = rebasePostCSSResources(rendered.generatedCSS, policy.file, policy.resourceFiles)
      const generated = postcss.parse(css, { from: policy.file + '?master-css-generated' })
      generated.walk((child: { masterCSSGlobal?: boolean }) => { child.masterCSSGlobal = true })
      root.append(generated.nodes)
    }
    histories.set(root, rendered.emittedGlobals)
    // Private history travels through the AST capture, never hydration/global inventory.
    root.masterCSSProcessedGlobals = rendered.emittedGlobals
  }
}
