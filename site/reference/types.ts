import type { ReferenceSheet } from './sheets'

export type ReferenceKind = 'utility' | 'rule' | 'tokens' | 'directive' | 'tool' | 'package'

export interface SyntaxRow {
  id: string
  syntax: string
  declarations: string
  identifiers: string[]
  group?: string
}

export interface ReferenceExample {
  id: string
  title: string
  classes: string[]
  css: string
  configuration?: string
}

export interface ReferenceDocument {
  id: string
  kind: ReferenceKind
  title: string
  description: string
  category: string
  url: string
  source: string
  sourceDigest: string
  language: string
  locale?: string
  aliases: string[]
  identifierAnchors?: Record<string, string>
  terms: string[]
  rows: SyntaxRow[]
  examples: ReferenceExample[]
  related: string[]
  guide?: string
  markdown: string
  headings: { id: string; title: string; depth: number }[]
  extractionNotes: string[]
  /** Structured reading model for pages migrated to Reference sheets. */
  sheet?: ReferenceSheet
}

export interface ReferenceCatalog {
  schemaVersion: 1
  locale?: string
  version: string
  revision: string
  sourceState: 'revision' | 'working-tree' | 'archive'
  semanticDigest: string
  documents: ReferenceDocument[]
}

export const referenceSections: { id: string; kinds: ReferenceKind[] }[] = [
  { id: 'rules', kinds: ['rule'] },
  { id: 'tokens', kinds: ['tokens'] },
  { id: 'utilities', kinds: ['utility'] },
  { id: 'directives', kinds: ['directive'] },
  { id: 'tools', kinds: ['tool', 'package'] },
]
