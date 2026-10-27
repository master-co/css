import React from 'react'
import snapshot0 from '~/site/../benchmarks/docs-page-css-size/snapshot.json'
import snapshot1 from '~/site/../benchmarks/tailwind-static-comparison/snapshot.json'
import snapshot2 from '~/site/../benchmarks/build-path-diagnostics/snapshot.json'
import snapshot3 from '~/site/../benchmarks/browser-css-cost/snapshot.json'
import snapshot4 from '~/site/../benchmarks/master-delivery-modes/snapshot.json'
import snapshot5 from '~/site/../benchmarks/interaction-cost/snapshot.json'
import snapshot6 from '~/site/../benchmarks/browser-lifecycle/snapshot.json'
import evidence from '~/site/../benchmarks/browser-lifecycle/long-session-evidence.json'
import { BenchmarkSource } from '~/site/components/benchmarks'

export const benchmarkSnapshots = {
  'docs-page-css-size': { generatedAt: snapshot0.generatedAt, href: 'https://github.com/master-co/css/blob/rc/benchmarks/docs-page-css-size/snapshot.json' },
  'tailwind-static-comparison': { generatedAt: snapshot1.generatedAt, href: 'https://github.com/master-co/css/blob/rc/benchmarks/tailwind-static-comparison/snapshot.json' },
  'build-path-diagnostics': { generatedAt: snapshot2.generatedAt, href: 'https://github.com/master-co/css/blob/rc/benchmarks/build-path-diagnostics/snapshot.json' },
  'browser-css-cost': { generatedAt: snapshot3.generatedAt, href: 'https://github.com/master-co/css/blob/rc/benchmarks/browser-css-cost/snapshot.json' },
  'master-delivery-modes': { generatedAt: snapshot4.generatedAt, href: 'https://github.com/master-co/css/blob/rc/benchmarks/master-delivery-modes/snapshot.json' },
  'interaction-cost': { generatedAt: snapshot5.generatedAt, href: 'https://github.com/master-co/css/blob/rc/benchmarks/interaction-cost/snapshot.json' },
  'browser-lifecycle': { generatedAt: snapshot6.generatedAt, href: 'https://github.com/master-co/css/blob/rc/benchmarks/browser-lifecycle/snapshot.json' },
  'long-session-evidence': { generatedAt: evidence.generatedAt, href: 'https://github.com/master-co/css/blob/rc/benchmarks/browser-lifecycle/long-session-evidence.json' }
}

export function BenchmarkSnapshot({ suite }: { suite: keyof typeof benchmarkSnapshots }) {
  return <BenchmarkSource {...benchmarkSnapshots[suite]} />
}
