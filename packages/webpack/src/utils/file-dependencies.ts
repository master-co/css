interface FileDependencySet {
  add?(dependency: string): unknown
  push?(dependency: string): unknown
  includes?(dependency: string): boolean
}

export function addFileDependency(fileDependencies: FileDependencySet | undefined, dependency: string) {
  if (!fileDependencies) return
  if (typeof fileDependencies.add === 'function') {
    fileDependencies.add(dependency)
    return
  }
  if (typeof fileDependencies.push === 'function') {
    if (typeof fileDependencies.includes !== 'function' || !fileDependencies.includes(dependency)) {
      fileDependencies.push(dependency)
    }
  }
}

