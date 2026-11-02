import type { ImageMetadata } from 'astro'

/**
 * Data shapes of the document components. `.astro` components export only themselves, so data
 * modules import these types from here.
 */

/** Markup passed as data: a string, MDX JSX or an Astro template value, rendered with `RenderNode`. */
export type DocumentMarkup = unknown

export interface DocumentAPIEntry {
  name: string
  href: string
  description: string
}

export interface DocumentChoice {
  title: string
  description: string
  href: string
  icon?: DocumentMarkup
}

export interface DocumentCodeExampleViewProps {
  title: string
  /** Named code blocks: their bars carry the part's label and its copy control. */
  sourceCode?: DocumentMarkup
  resultCode?: DocumentMarkup
  resultKind?: 'generated-css'
  diagnostic?: { severity: 'Warning' | 'Error', rule: string, message: string }
}

export interface DocumentCodeExampleProps extends Omit<DocumentCodeExampleViewProps, 'sourceCode' | 'resultCode'> {
  language: string
  resultLanguage?: string
  source: string
  result?: string
  sourceLabel?: string
  resultLabel?: string
}

export interface DocumentFileEntry {
  name: string
  description?: string
  children?: readonly DocumentFileEntry[]
}

export interface DocumentFileTreeProps {
  title: string
  entries: readonly DocumentFileEntry[]
  caption?: string
}

export interface DocumentFlowStep {
  title: string
  description: string
}

export interface DocumentFlowProps {
  title: string
  steps: readonly DocumentFlowStep[]
  caption?: string
}

export interface IllustrationImages {
  light: ImageMetadata
  dark: ImageMetadata
}

export interface DocumentOption {
  name: string
  defaultValue?: string
  description: DocumentMarkup
}

export interface DocumentParameter {
  name: string
  type: string
  requirement?: string
  description: DocumentMarkup
}

export interface DocumentPromptProps {
  title: string
  text: string
}

export interface DocumentValueRow {
  id: string
  title: string
  identifier?: string
  values: { label: string, value: string }[]
}

export interface NamespaceUtilityGroup {
  label: string
  keys: string[]
  namespace?: string
  namespaces?: string[]
  description?: DocumentMarkup
}

export interface DocumentationIndexEntry {
  id: string
  title: string
  displayTitle?: string
  description?: string
  category: string
  url: string
  disabled?: boolean
  unfinished?: boolean
}

export interface DocumentationIndexSection {
  id: string
  title: string
  description: string
  groups: { id?: string; title?: string; entries: DocumentationIndexEntry[] }[]
}
