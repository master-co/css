import type { CompileCSSManifestResult } from '@master/css-compiler'
import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export interface LoadManifestOptions {
  baseManifest?: MasterCSSManifest
  classes?: string[]
  onWarning?: (warning: string) => void
}

export type LoadManifestResult = CompileCSSManifestResult

export interface LoadProjectManifestOptions extends LoadManifestOptions {
  entries?: string[]
}

export interface ProjectSourceEntryPlan {
  entry: string
  include: string[]
  exclude: string[]
  files: string[]
}

export interface ProjectSourcePlan {
  version: 1
  entries: ProjectSourceEntryPlan[]
  files: string[]
}

export interface LoadProjectManifestResult {
  entries: string[]
  manifest: MasterCSSManifest
  dependencies: string[]
  extractionPolicy: CSSDirectiveExtractionPolicy
  classNames: string[]
  nativeClassNames: string[]
  nativeCSS: string
  css: string
  generatedCSS: string
  warnings: string[]
  sourcePlan: ProjectSourcePlan
}
