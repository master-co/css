import { cpus, arch, platform, release } from 'node:os'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BenchmarkEnvironment, BenchmarkPackage } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '../..')

export function collectEnvironment(): BenchmarkEnvironment {
  const cpuList = cpus()

  return {
    os: {
      platform: platform(),
      release: release(),
      arch: arch()
    },
    node: process.version,
    cpu: {
      model: cpuList[0]?.model || 'unknown',
      count: cpuList.length
    }
  }
}

export async function collectPackageVersions(packageNames: string[]): Promise<BenchmarkPackage[]> {
  const packageJSON = JSON.parse(await readFile(resolve(repoRoot, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const benchmarkPackageJSON = JSON.parse(await readFile(resolve(repoRoot, 'benchmarks/package.json'), 'utf8')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const sources = [
    packageJSON.dependencies,
    packageJSON.devDependencies,
    benchmarkPackageJSON.dependencies,
    benchmarkPackageJSON.devDependencies
  ]

  return packageNames.map((name) => ({
    name,
    version: sources.find((source) => source?.[name])?.[name] || 'unknown'
  }))
}
