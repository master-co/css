'use client'

import { IconBook, IconLayoutGrid, IconPalette } from '@tabler/icons-react'
import DocumentationIndex, { type DocumentationIndexSection } from '~/site/components/DocumentationIndex'

const sections: DocumentationIndexSection[] = [
  { id: 'gallery-learning', title: 'Learn', description: 'Start with the concepts and a working example.', Icon: IconBook, groups: [{ entries: [
    { id: 'intro', title: 'Introduction', description: 'Write your first classes and choose a delivery mode.', category: 'Guide', url: '/guide/introduction' },
    { id: 'tutorial', title: 'Syntax tutorial', description: 'Build a button with states, conditions and a project token.', category: 'Guide', url: '/guide/syntax-tutorial' },
  ] }] },
  { id: 'gallery-utilities', title: 'Utilities', description: 'Look up a specific layout behavior.', Icon: IconLayoutGrid, groups: [
    { id: 'gallery-flow', title: 'Document flow', entries: [
      { id: 'clear', title: 'clear', category: 'Document flow', url: '/reference/clear' },
      { id: 'display', title: 'display', category: 'Document flow', url: '/reference/display' },
    ] },
    { id: 'gallery-layout', title: 'Layout', entries: [
      { id: 'flex', title: 'flex', category: 'Layout', url: '/reference/flex' },
      { id: 'grid', title: 'grid', category: 'Layout', url: '/reference/grid' },
    ] },
  ] },
  { id: 'gallery-foundations', title: 'Foundations', description: 'Share values across the interface.', Icon: IconPalette, groups: [{ entries: [
    { id: 'colors', title: 'Colors', description: 'Use palette steps and semantic color roles.', category: 'Foundations', url: '/guide/colors' },
    { id: 'spacing', title: 'Spacing', description: 'Set a consistent rhythm with the spacing scale.', category: 'Foundations', url: '/guide/spacing' },
  ] }] },
]

export default function DocumentationIndexGallery() {
  return <div data-index-gallery="">
    <DocumentationIndex name="guide" sections={sections} showDescriptions related={{ href: '/reference', title: 'Full Reference', description: 'Browse all utilities, language rules, tokens and tools.', Icon: IconBook }} />
  </div>
}
