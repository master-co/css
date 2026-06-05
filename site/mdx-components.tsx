import { mdxComponents } from 'internal/components/mdxComponents'
import dynamic from 'next/dynamic'
import type { MDXComponents } from 'mdx/types'

const Class2CSS = dynamic(() => import('./components/Class2CSS'))

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        Class2CSS: (props: any) => <Class2CSS {...props} />,
        ...mdxComponents,
        ...components,
    }
}