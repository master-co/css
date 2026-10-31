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
  language: 'en'
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
  version: string
  revision: string
  sourceState: 'revision' | 'working-tree' | 'archive'
  semanticDigest: string
  documents: ReferenceDocument[]
}

export const referenceSections: { id: string; title: string; titleTW: string; kinds: ReferenceKind[]; description: string; descriptionTW: string }[] = [
  { id: 'rules', title: 'Syntax', titleTW: '語法', kinds: ['rule'], description: 'How a class names its declarations, selectors, conditions and layer.', descriptionTW: 'class 如何寫出宣告、選擇器、條件與 layer。' },
  { id: 'tokens', title: 'Tokens', titleTW: 'Tokens', kinds: ['tokens'], description: 'Every preset value, the classes that read it and how to change it.', descriptionTW: '每個 preset 值、讀取它的 class，以及如何調整。' },
  { id: 'utilities', title: 'Recipes', titleTW: '配方', kinds: ['utility'], description: 'Preset classes that write several declarations or take a number.', descriptionTW: '一次寫出多條宣告或接收數值的 preset class。' },
  { id: 'directives', title: 'Directives', titleTW: '指令', kinds: ['directive'], description: 'Stylesheet at-rules for imports, themes, definitions, scanning and pruning.', descriptionTW: '用於匯入、主題、定義、掃描與修剪的樣式表 at-rule。' },
  { id: 'tools', title: 'Tools', titleTW: '工具', kinds: ['tool', 'package'], description: 'The CLI, the MCP server and the public packages.', descriptionTW: 'CLI、MCP server 與公開套件。' }
]
