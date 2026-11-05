import * as mdx from 'eslint-mdx'
import { parseFrontmatter } from '@astrojs/markdown-remark'

/** Astro removes metadata before MDX parsing. Preserve offsets so lint still reports the authored line. */
export function parseForESLint(source, options) {
  const { content } = parseFrontmatter(source, { frontmatter: 'empty-with-spaces' })
  return mdx.parseForESLint(content, options)
}

export const meta = { name: 'master-site-mdx', version: '1' }
