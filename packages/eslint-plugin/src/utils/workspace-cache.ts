import { discoverManifestEntriesSync } from '@master/css-compiler/project/sync'
import { discoverBuildWorkspaceDirectoriesSync } from '@master/css-internal/workspace-directories'
import { isDependencyCurrent, stampDependency, type DependencyStamp } from './dependency-stamp'

export interface WorkspaceSnapshot {
  cwd: string
  directories: readonly string[]
  dependencies: readonly DependencyStamp[]
  references: number
  disposeTimer?: ReturnType<typeof setTimeout>
}

const snapshots = new Map<string, WorkspaceSnapshot>()

export function acquireWorkspaceSnapshot(cwd: string): WorkspaceSnapshot {
  let snapshot = snapshots.get(cwd)
  if (!snapshot || !snapshot.dependencies.every(isDependencyCurrent)) {
    const dependencies: DependencyStamp[] = []
    const directories = discoverBuildWorkspaceDirectoriesSync(
      cwd,
      discoverManifestEntriesSync({ root: cwd }),
      file => dependencies.push(stampDependency(file))
    )
    snapshot = { cwd, directories, dependencies, references: 0 }
    snapshots.set(cwd, snapshot)
  }
  if (snapshot.disposeTimer) clearTimeout(snapshot.disposeTimer)
  snapshot.disposeTimer = undefined
  snapshot.references++
  return snapshot
}

export function releaseWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  if (--snapshot.references || snapshot.disposeTimer) return
  snapshot.disposeTimer = setTimeout(() => {
    if (snapshots.get(snapshot.cwd) === snapshot) snapshots.delete(snapshot.cwd)
  }, 1_000)
  snapshot.disposeTimer.unref?.()
}
