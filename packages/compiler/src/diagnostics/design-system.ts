import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { createToolingSession } from '@master/css-tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSDesignSystemOptions,
  MasterCSSDesignSystemReport
} from '@master/css-tooling/lint'
import { loadProjectManifest } from '../project/manifest'
import type { MasterCSSProjectResult, MasterCSSProjectSourceGraph } from '../project/options'

export type { MasterCSSDesignSystemOptions, MasterCSSDesignSystemReport } from '@master/css-tooling/lint'

export interface CreateMasterCSSDesignSystemReportOptions {
  readonly manifest: MasterCSSManifest
  readonly cwd?: string
  readonly entries?: readonly string[]
  readonly designSystem?: MasterCSSDesignSystemOptions
  /**
   * Route and component stylesheets imported from JavaScript rather than reached from a CSS entry.
   * They resolve against the same project manifest and report no importers.
   */
  readonly routeStylesheets?: readonly string[]
  readonly resolveExistingFile?: (file: string) => string | Promise<string>
  readonly onDependency?: (file: string) => void
}

export interface MasterCSSProjectDesignSystemReport extends MasterCSSDesignSystemReport {
  readonly project: {
    readonly cwd: string
    readonly entries: readonly string[]
    readonly files: readonly string[]
    readonly routeStylesheets: readonly string[]
    readonly excluded: readonly string[]
    readonly edges: MasterCSSProjectSourceGraph['edges']
  }
}

/** Inspect only project-owned CSS reached from managed entries, preserving authored offsets. */
export async function createMasterCSSDesignSystemReport(
  options: CreateMasterCSSDesignSystemReportOptions
): Promise<MasterCSSProjectDesignSystemReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd())
  const project = await loadProjectManifest({
    root: cwd,
    entries: options.entries,
    baseManifest: options.manifest,
    includeSourceGraph: true,
    onDependency: options.onDependency
  })
  return inspectResolvedProjectDesignSystem(project, cwd, options)
}

/** Shared orchestration for standalone and combined project inspection. */
export async function inspectResolvedProjectDesignSystem(
  project: MasterCSSProjectResult,
  cwd: string,
  options: Pick<CreateMasterCSSDesignSystemReportOptions, 'designSystem' | 'routeStylesheets' | 'resolveExistingFile'>
): Promise<MasterCSSProjectDesignSystemReport> {
  if (!project.entries.length) throw new Error('No project CSS entry was found. Add a stylesheet importing @master/css.')
  const graph = project.sourceGraph
  if (!graph) throw new Error('The project loader did not return its authored source graph.')
  const importers = new Map<string, Set<string>>()
  for (const { from, resolved } of graph.edges) {
    const sources = importers.get(resolved) ?? new Set<string>()
    sources.add(from)
    importers.set(resolved, sources)
  }
  const stylesheets = []
  const excluded: string[] = []
  for (const file of graph.files) {
    if (!file.projectOwned) {
      excluded.push(file.source)
      continue
    }
    await options.resolveExistingFile?.(file.source)
    stylesheets.push({
      source: file.source,
      content: file.content,
      importers: [...(importers.get(file.source) ?? [])]
    })
  }
  const managed = new Set(stylesheets.map(file => file.source))
  const routeStylesheets: string[] = []
  for (const file of options.routeStylesheets ?? []) {
    const source = path.resolve(cwd, file)
    if (managed.has(source)) continue
    managed.add(source)
    routeStylesheets.push(source)
    await options.resolveExistingFile?.(source)
    stylesheets.push({ source, content: await readFile(source, 'utf8'), importers: [] })
  }
  using tooling = await createToolingSession({ manifest: project.manifest, nativeClassNames: project.nativeClassNames })
  const report = tooling.inspectDesignSystem({ ...(options.designSystem ?? { version: 1 }), stylesheets })
  return {
    ...report,
    project: {
      cwd,
      entries: project.entries,
      files: stylesheets.map(file => file.source),
      routeStylesheets,
      excluded,
      edges: graph.edges
    }
  }
}
