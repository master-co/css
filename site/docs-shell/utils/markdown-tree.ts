import { remark } from 'remark'
import gfm from 'remark-gfm'
import Slugger from 'github-slugger'
import resolveHeading from './resolve-heading'

const parser = remark().use(gfm)
export const markdownTree = (source: string) => parser.parse(source)

export function markdownHeadings(source: string) {
  const slugger = new Slugger()
  const headings: { id: string; title: string; depth: number }[] = []
  function visit(node: any) {
    if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
      const title = node.children.filter((child: any) => child.type === 'text' || child.type === 'inlineCode').map((child: any) => child.value).join(' ').trim()
      const resolved = resolveHeading(title, slugger.slug(title))
      headings.push({ id: resolved.id!, title: resolved.title, depth: node.depth })
    }
    node.children?.forEach(visit)
  }
  visit(markdownTree(source))
  return headings
}
