'use client'

import { IconBook, IconBraces, IconLayoutGrid, IconPalette, IconSettings, IconTerminal2 } from '@tabler/icons-react'
import { useLocale } from 'internal/contexts/locale'
import { useTranslation } from 'internal/contexts/i18n'
import DocumentationIndex from '../components/DocumentationIndex'
import { referenceSections, type ReferenceDocument } from './types'

type Entry = Pick<ReferenceDocument, 'id' | 'kind' | 'title' | 'description' | 'category' | 'url'>
const sectionIcons = { utilities: IconLayoutGrid, rules: IconBraces, tokens: IconPalette, directives: IconSettings, tools: IconTerminal2 }

export default function ReferenceIndex({ documents, categoryOrder }: { documents: Entry[]; categoryOrder: string[] }) {
  const tw = useLocale() === 'tw'
  const $ = useTranslation()
  const sections = referenceSections.map(section => {
    const entries = documents.filter(doc => section.kinds.includes(doc.kind))
    const categories = [...new Set(entries.map(doc => doc.category))]
      .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
    return {
      id: section.id,
      title: tw ? section.titleTW : section.title,
      description: tw ? section.descriptionTW : section.description,
      Icon: sectionIcons[section.id as keyof typeof sectionIcons],
      groups: categories.map(category => ({ id: `${section.id}-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, title: $(category), entries: entries.filter(doc => doc.category === category) }))
    }
  }).filter(section => section.groups.length)
  return <DocumentationIndex name="reference" sections={sections} related={{
    href: '/guide', Icon: IconBook,
    title: tw ? '從 Guide 開始' : 'Start with the Guide',
    description: tw ? '循序學習概念，並透過範例開始實作。' : 'Learn the concepts and build with step-by-step examples.'
  }} />
}
