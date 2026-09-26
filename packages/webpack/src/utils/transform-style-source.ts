import {
  compileStylesheet,
  resolveStylesheet,
  transformStylesheet
} from '@master/css-compiler/stylesheet'
import {
  composeStylesheetHostSync,
  resolveStylesheetSync
} from '@master/css-compiler/node'
import { VIRTUAL_CSS_ID } from '@master/css-internal/style-module'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { defaultBuildManifest } from '@master/css-internal/project'
import { stylesheetSlot } from './stylesheet-slot'

interface TransformStyleSourceOptions {
  projectDir?: string
  masterImport?: string
  preserveImports?: boolean
  onDependency?: (file: string) => void
}

function hasMasterStyleManifestDirective(source: string) {
  return source.includes('@settings') || source.includes('@theme') || source.includes('@master')
}

export async function transformStyleSource(
  resourcePath: string,
  source: string,
  options: TransformStyleSourceOptions = {}
) {
  const { projectDir, masterImport = VIRTUAL_CSS_ID } = options
  const dependencies: string[] = []
  const resolution = options.preserveImports
    ? await resolveStylesheet(resourcePath, source, {
      projectDir, preserveImports: true,
      resolveImport: () => undefined,
      onDependency: options.onDependency
    })
    : resolveStylesheetSync(resourcePath, source, { projectDir, preserveImports: true })
  if (!resolution) {
    return { code: source, dependencies }
  }
  if (resolution.kind === 'master-package' || resolution.kind === 'master-package-entry') {
    const cleanSource = resolution.outputSource
    if (!hasMasterStyleManifestDirective(cleanSource)) {
      return {
        code: cleanSource,
        dependencies
      }
    }
    const result = await compileStylesheet(resourcePath, cleanSource, {
      baseManifest: defaultBuildManifest,
      projectDir,
      preserveNativeCSS: true
    })
    return {
      code: result.css || result.nativeCSS || '',
      dependencies: result.dependencies || dependencies
    }
  }

  if (resolution.kind !== 'entry') {
    if (resolution.kind === 'local' || resolution.kind === 'plain') {
      const entries = await discoverManifestEntries({ root: projectDir })
      if (!entries.length && resolution.kind === 'plain') return { code: source, dependencies }
      const projectManifest = await loadProjectManifest({
        root: projectDir,
        entries,
        baseManifest: defaultBuildManifest,
        onDependency: options.onDependency
      })
      const result = await transformStylesheet(resourcePath, source, {
        baseManifest: projectManifest.manifest,
        projectDir,
        referenceFiles: entries,
        transformNativeStylesheets: true,
        generatedGlobals: /\.module\.(?:css|scss|sass)$/u.test(resourcePath) ? 'separate' : 'inline',
        onDependency: options.onDependency
      })
      return {
        code: result.code,
        globalStylesheet: result.globalStylesheet,
        dependencies: [...new Set([
          ...projectManifest.dependencies,
          ...result.dependencies
        ])]
      }
    }
    return { code: source, dependencies }
  }

  dependencies.push(...resolution.dependencies)
  return {
    code: composeStylesheetHostSync(source, {
      masterImport,
      ...(options.preserveImports ? { masterSource: stylesheetSlot(resourcePath) } : {})
    }),
    dependencies
  }
}
