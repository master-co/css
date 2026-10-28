'use client'

import { IconBook, IconLayoutGrid, IconPalette } from '@tabler/icons-react'
import DocumentationIndex, { type DocumentationIndexSection } from '~/site/components/DocumentationIndex'

function sectionsFor(prefix: string): DocumentationIndexSection[] {
  return [
    { id: `${prefix}-learning`, title: 'Learn', description: 'Start with one complete example, then build on it.', Icon: IconBook, groups: [{ entries: [
      { id: `${prefix}-intro`, title: 'Introduction', description: 'Write your first classes and choose a delivery mode.', category: 'Guide', url: '/guide/introduction' },
      { id: `${prefix}-tutorial`, title: 'Syntax tutorial', description: 'Build a button with states and conditions.', category: 'Guide', url: '/guide/syntax-tutorial' },
    ] }] },
    { id: `${prefix}-utilities`, title: 'Utilities', description: 'Look up a specific layout behavior.', Icon: IconLayoutGrid, groups: [
      { id: `${prefix}-flow`, title: 'Document flow', entries: [
        { id: `${prefix}-clear`, title: 'clear', category: 'Document flow', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/clear' },
        { id: `${prefix}-display`, title: 'display', category: 'Document flow', url: '/guide/layout-system#choose-css-grid-or-flexbox' },
      ] },
      { id: `${prefix}-layout`, title: 'Layout', entries: [
        { id: `${prefix}-flex`, title: 'flex', category: 'Layout', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/flex-grow' },
        { id: `${prefix}-grid`, title: 'grid', category: 'Layout', url: '/guide/layout-system#add-explicit-tracks-only-when-needed' },
      ] },
    ] },
    { id: `${prefix}-foundations`, title: 'Foundations', description: 'Share values across the interface.', Icon: IconPalette, groups: [{ entries: [
      { id: `${prefix}-colors`, title: 'Colors', description: 'Use palette steps and semantic color roles.', category: 'Foundations', url: '/guide/colors' },
      { id: `${prefix}-spacing`, title: 'Spacing', description: 'Set a consistent rhythm with the spacing scale.', category: 'Foundations', url: '/guide/spacing' },
    ] }] },
  ]
}

const related = { href: '/reference', title: 'Full Reference', description: 'Browse utilities, tokens and tools.', Icon: IconBook }
export default function IndexReviewScene({ prefix }: { prefix: string }) {
  return <DocumentationIndex name="guide" idPrefix={prefix} sections={sectionsFor(prefix)} showDescriptions related={related} />
}
