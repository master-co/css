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
  { id: 'utilities', title: 'Utilities', titleTW: 'Utilities', kinds: ['utility'], description: 'Find classes, aliases, CSS declarations and values.', descriptionTW: '查找 class、別名、CSS 宣告與值。' },
  { id: 'rules', title: 'Syntax & rules', titleTW: '語法與規則', kinds: ['rule'], description: 'Check how values, selectors, conditions and layers combine.', descriptionTW: '查核值、選擇器、條件與 layer 的組合方式。' },
  { id: 'tokens', title: 'Tokens & namespaces', titleTW: 'Tokens 與命名空間', kinds: ['tokens'], description: 'Inspect preset values and the utilities that consume them.', descriptionTW: '查看 preset 值及使用這些值的 utilities。' },
  { id: 'directives', title: 'Directives & settings', titleTW: '指令與設定', kinds: ['directive'], description: 'Check stylesheet authoring contracts and their scope.', descriptionTW: '查核樣式表指令與設定的適用範圍。' },
  { id: 'tools', title: 'Tools & APIs', titleTW: '工具與 APIs', kinds: ['tool', 'package'], description: 'Find command, tool and public package contracts.', descriptionTW: '查找 CLI、MCP 工具及公開 package 契約。' }
]
