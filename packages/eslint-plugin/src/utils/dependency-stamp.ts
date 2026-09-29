import { statSync } from 'node:fs'

export interface DependencyStamp {
  path: string
  mtimeNs: bigint
  ctimeNs: bigint
  size: bigint
  ino: bigint
}

export function stampDependency(path: string): DependencyStamp {
  try {
    const { mtimeNs, ctimeNs, size, ino } = statSync(path, { bigint: true })
    return { path, mtimeNs, ctimeNs, size, ino }
  } catch {
    return { path, mtimeNs: -1n, ctimeNs: -1n, size: -1n, ino: -1n }
  }
}

export function isDependencyCurrent(stamp: DependencyStamp) {
  const current = stampDependency(stamp.path)
  return current.mtimeNs === stamp.mtimeNs && current.ctimeNs === stamp.ctimeNs
    && current.size === stamp.size && current.ino === stamp.ino
}
