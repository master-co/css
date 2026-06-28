import type { BenchmarkAdapter, BenchmarkFixture } from '../shared/types'

export const benchmarkFixtures = [
    {
        id: 'minimal',
        name: 'Minimal',
        purpose: 'Small useful page or landing section.',
        stress: 'Framework overhead, cold-start cost, and minimum payload.',
        suites: ['css-output-size', 'css-structure', 'build-performance', 'build-diagnostics', 'extraction-diagnostics', 'compiler-diagnostics', 'startup-diagnostics', 'master-delivery-modes', 'progressive-hydration-diagnostics', 'browser-lifecycle'],
        limits: ['Not representative of dense application UI.']
    },
    {
        id: 'docs',
        name: 'Docs',
        purpose: 'Dense article, navigation, code blocks, and tables.',
        stress: 'Documentation layout, typography, and nested content.',
        suites: ['css-output-size', 'css-structure', 'build-performance', 'build-diagnostics', 'extraction-diagnostics', 'compiler-diagnostics', 'startup-diagnostics', 'master-delivery-modes', 'progressive-hydration-diagnostics', 'browser-css-cost', 'browser-lifecycle'],
        limits: ['Does not model frequent runtime mutation.']
    },
    {
        id: 'dashboard',
        name: 'Dashboard',
        purpose: 'Repeated cards, tables, filters, charts, and states.',
        stress: 'Rule reuse, duplicated utilities, and large DOM.',
        suites: ['css-output-size', 'css-structure', 'build-performance', 'build-diagnostics', 'extraction-diagnostics', 'compiler-diagnostics', 'startup-diagnostics', 'master-delivery-modes', 'progressive-hydration-diagnostics', 'browser-css-cost', 'interaction-cost', 'browser-lifecycle'],
        limits: ['Chart visuals are fixture placeholders, not a chart-library benchmark.']
    },
    {
        id: 'dynamic',
        name: 'Dynamic',
        purpose: 'Insert, remove, and toggle classes during interaction.',
        stress: 'Runtime mutation, extraction limits, and recalculation cost.',
        suites: ['master-delivery-modes', 'interaction-cost', 'runtime-mutation-diagnostics', 'runtime-style-invalidation-diagnostics', 'browser-lifecycle'],
        limits: ['Browser scheduling can affect interaction timing.']
    },
    {
        id: 'stress-css',
        name: 'Stress CSS',
        purpose: 'Controlled small, medium, and large CSS outputs.',
        stress: 'Browser style calculation as CSS volume grows.',
        suites: ['css-output-size', 'css-structure', 'build-diagnostics', 'extraction-diagnostics', 'compiler-diagnostics', 'startup-diagnostics', 'master-delivery-modes', 'progressive-hydration-diagnostics', 'browser-css-cost'],
        limits: ['Intentionally artificial CSS volume.']
    },
    {
        id: 'stress-dom',
        name: 'Stress DOM',
        purpose: 'Large DOM with fixed CSS.',
        stress: 'DOM, style, and layout scaling isolated from CSS output size.',
        suites: ['browser-css-cost', 'interaction-cost', 'runtime-mutation-diagnostics', 'runtime-style-invalidation-diagnostics', 'browser-lifecycle'],
        limits: ['Intentionally artificial DOM volume.']
    }
] satisfies BenchmarkFixture[]

export const benchmarkAdapters = [
    {
        id: 'master-runtime',
        name: 'Master CSS runtime',
        family: 'master-css'
    },
    {
        id: 'master-static',
        name: 'Master CSS static',
        family: 'master-css'
    },
    {
        id: 'master-progressive',
        name: 'Master CSS progressive',
        family: 'master-css'
    },
    {
        id: 'tailwind-cli',
        name: 'Tailwind CSS CLI',
        family: 'tailwind-css'
    },
    {
        id: 'tailwind-vite',
        name: 'Tailwind CSS Vite',
        family: 'tailwind-css'
    },
    {
        id: 'browser-css',
        name: 'Browser CSS baseline',
        family: 'browser'
    },
    {
        id: 'browser-dom',
        name: 'Browser DOM baseline',
        family: 'browser'
    }
] satisfies BenchmarkAdapter[]
