import type { markdownTree } from '@master/internal-site/utils/markdown-tree'
import type { PreparedCode } from '@master/internal-site/utils/prepared-code'
import type { CodeProp } from '@master/internal-site/components/code-props'

type Children<T> = T extends { children: (infer Child)[] } ? Child : never
type Tree = ReturnType<typeof markdownTree>
export type ReferenceMarkdownNode = Tree | Children<Tree> | Children<Children<Tree>> | Children<Children<Children<Tree>>>
type Code = Extract<ReferenceMarkdownNode, { type: 'code' }>
export type ReferenceCodeNode = Code & { data: { prepared: PreparedCode } }

/** Only authored boundaries group examples; adjacent code blocks alone never imply a relationship. */
export function documentExampleEnd(nodes: ReferenceMarkdownNode[], start: number): number | undefined {
  const first = nodes[start]
  if (first?.type === 'html' && first.value === '<!-- /document-example -->') throw new Error('Unexpected Reference document example closing boundary')
  if (first?.type !== 'html' || first.value !== '<!-- document-example -->') return undefined
  for (let index = start + 1; index < nodes.length; index++) {
    const node = nodes[index]
    if (node.type === 'html' && node.value === '<!-- /document-example -->') {
      if (index === start + 1) throw new Error('Empty Reference document example')
      return index
    }
    if (node.type !== 'code') throw new Error('Reference document examples must contain explicit code blocks only')
  }
  throw new Error('Unclosed Reference document example')
}

/** Source/result pairs use the unformatted code displayed by DocumentCodeExample. */
export function isStylesheetExample(title: ReferenceMarkdownNode, source?: ReferenceMarkdownNode, result?: ReferenceMarkdownNode): boolean {
  return title.type === 'paragraph' && title.children.length === 1 && title.children[0].type === 'strong'
    && title.children[0].children.every(child => child.type === 'text')
    && source?.type === 'code' && source.lang === 'css' && /\bstylesheet=source\b/.test(source.meta ?? '')
    && result?.type === 'code' && result.lang === 'css' && /\bstylesheet=result\b/.test(result.meta ?? '')
}

export function referenceCodeProps(node: Code, stylesheetExample = false): CodeProp {
  // A stylesheet example's result sits in the Generated CSS disclosure, so its source needs no label.
  if (stylesheetExample) return { lang: 'css' }
  if (node.lang === 'typescript' && node.meta === 'declaration') {
    return { lang: 'typescript', beautify: false, dedent: false }
  }
  return {
    lang: node.lang || 'plaintext',
    // Plain blocks like the Guide's; only an explicit file name earns a tab bar.
    name: node.meta?.match(/name=(\S+)/)?.[1],
    beautify: node.lang === 'css' || node.lang === 'html',
    dedent: node.lang === 'sh' ? false : undefined
  }
}
