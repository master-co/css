import { mdxComponents } from '~/site/docs-shell/components/mdxComponents'
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...mdxComponents, ...components }
}
