import React from 'react'
import sources from '~/site/.generated/benchmarks/sources.json'
import { BenchmarkSource } from '~/site/components/benchmarks'

export const benchmarkSnapshots = sources

export function BenchmarkSnapshot({ suite }: { suite: keyof typeof benchmarkSnapshots }) {
  return <BenchmarkSource {...benchmarkSnapshots[suite]} />
}
