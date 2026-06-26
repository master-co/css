import { mdxComponents } from 'internal/components/mdxComponents'
import dynamic from 'next/dynamic'
import type { MDXComponents } from 'mdx/types'
import {
    BenchmarkBars,
    BenchmarkDelta,
    BenchmarkFigure,
    BenchmarkMetricTable,
    BenchmarkSampleSummary,
    BenchmarkStackedBars
} from './components/benchmarks'

const Class2CSS = dynamic(() => import('./components/Class2CSS'))

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        BenchmarkBars,
        BenchmarkDelta,
        BenchmarkFigure,
        BenchmarkMetricTable,
        BenchmarkSampleSummary,
        BenchmarkStackedBars,
        Class2CSS: (props: any) => <Class2CSS {...props} />,
        ...mdxComponents,
        ...components,
    }
}
