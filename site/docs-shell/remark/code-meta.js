import { visit } from 'unist-util-visit'

export default function remarkCodeMeta() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      const meta = node.meta?.trim()
      if (meta) {
        node.data = {
          ...node.data,
          hProperties: {
            meta,
          },
        }
      }
    })
  }
}