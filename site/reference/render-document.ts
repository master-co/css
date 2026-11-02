import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'
import { prepareCode } from '@master/internal-site/utils/prepared-code'
import { markdownTree } from '@master/internal-site/utils/markdown-tree'
import { isStylesheetExample, referenceCodeProps, type ReferenceMarkdownNode, type ReferenceCodeNode } from './code-block'
import type { ReferenceDocument } from './types'

/** Private route payload; portable Reference exports keep the Markdown source. */
export interface ReferenceRenderDocument extends ReferenceDocument {
  renderDigest: string
  tree: ReturnType<typeof markdownTree>
}

/** Invalidate prepared trees when parsing, formatting, grammars or semantics change. */
export async function referenceRenderVersion(siteRoot: string): Promise<string> {
  const files = await fg([
    'adapters/**/*.ts',
    'reference/{render-document,code-block}.ts',
    'package.json',
    'tsconfig.json',
    '../tsconfig.json',
    '../bun.lock',
    '../bunfig.toml',
    '../scripts/typescript-*.mjs',
    '../packages/{binding*,schema,tooling,language-service,preset}/package.json',
    '../packages/{binding*,schema,tooling,language-service,preset}/src/**/*.{ts,json}',
    '../packages/language-service/syntaxes/*.json',
    '../packages/{binding*,preset}/**/*.{node,wasm,json}'
  ], { cwd: siteRoot, onlyFiles: true, ignore: ['**/node_modules/**', '**/*.test.ts'] })
  const hash = createHash('sha256')
  // The exact package version pins parsing, formatting, grammar and shared rendering.
  hash.update(await readFile(new URL(import.meta.resolve('@master/internal-site/config'))))
  for (const file of files.sort()) {
    hash.update(file).update(await readFile(path.resolve(siteRoot, file)))
  }
  return hash.digest('hex')
}

export async function createReferenceRenderDocument(document: ReferenceDocument, version: string, previous?: ReferenceRenderDocument): Promise<ReferenceRenderDocument> {
  const renderDigest = createHash('sha256').update(version).update(JSON.stringify({ kind: document.kind, markdown: document.markdown })).digest('hex')
  if (previous?.renderDigest === renderDigest) return { ...document, renderDigest, tree: previous.tree }
  const tree = markdownTree(document.markdown)
  const { default: highlightCode } = await import('../adapters/highlight.ts')
  async function prepare(nodes: ReferenceMarkdownNode[]) {
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index]
      if (isStylesheetExample(node, nodes[index + 1], nodes[index + 2])) {
        await prepareNode(nodes[++index], true)
        await prepareNode(nodes[++index], true)
      } else if (node.type === 'code') await prepareNode(node)
      else if ('children' in node) await prepare(node.children)
    }
  }
  async function prepareNode(node: ReferenceMarkdownNode, example = false) {
    if (node.type !== 'code') throw new Error('Expected Reference code block')
    const props = referenceCodeProps(node, example)
    const preparedNode = node as ReferenceCodeNode
    preparedNode.data = { ...node.data, prepared: await prepareCode(await highlightCode(node.value, {
      lang: props.lang, beautify: !!props.beautify, dedent: props.dedent
    })) }
  }
  await prepare(tree.children)
  return { ...document, renderDigest, tree }
}
