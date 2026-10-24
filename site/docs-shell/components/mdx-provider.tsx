import type { MDXComponents } from 'mdx/types'
import { mdxComponents } from './mdxComponents'

/** The MDX provider supplies Markdown renderers; content imports its custom components. */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...mdxComponents, ...components }
}
