import type { markdownTree } from '../docs-shell/utils/markdown-tree'
import type { PreparedCode } from '../docs-shell/utils/prepared-code'
import type { CodeProp } from '../docs-shell/components/CodeView'

type Children<T> = T extends { children: (infer Child)[] } ? Child : never
type Tree = ReturnType<typeof markdownTree>
export type ReferenceMarkdownNode = Tree | Children<Tree> | Children<Children<Tree>> | Children<Children<Children<Tree>>>
type Code = Extract<ReferenceMarkdownNode, { type: 'code' }>
export type ReferenceCodeNode = Code & { data: { prepared: PreparedCode } }

/** Source/result pairs use the unformatted code displayed by DocumentCodeExample. */
export function isStylesheetExample(title: ReferenceMarkdownNode, source?: ReferenceMarkdownNode, result?: ReferenceMarkdownNode): boolean {
  return title.type === 'paragraph' && title.children.length === 1 && title.children[0].type === 'strong'
    && title.children[0].children.every(child => child.type === 'text')
    && source?.type === 'code' && source.lang === 'css' && source.meta === 'name=Source stylesheet=source'
    && result?.type === 'code' && result.lang === 'css' && result.meta === 'name=Result stylesheet=result'
}

export function referenceCodeProps(node: Code, stylesheetExample = false): CodeProp {
  if (stylesheetExample) return { lang: 'css', children: node.value, copyable: false }
  if (node.lang === 'typescript' && node.meta === 'declaration') {
    return { lang: 'typescript', children: node.value, beautify: false, dedent: false, copyable: false }
  }
  return {
    lang: node.lang || 'plaintext',
    name: node.meta?.match(/name=(\S+)/)?.[1] || node.lang?.toUpperCase(),
    beautify: node.lang === 'css' || node.lang === 'html',
    dedent: node.lang === 'sh' ? false : undefined,
    children: node.value
  }
}
