'use client'

import { IconBook, IconLayersIntersect, IconPalette, IconPencil, IconRocket, IconRobot, IconSettings } from '@tabler/icons-react'
import { useLocale } from '~/site/docs-shell/contexts/locale'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import DocumentationIndex from '~/site/components/DocumentationIndex'
import { guideOverviewSections, type GuideCategory } from '~/site/utils/guide-overview'

const sectionIcons: Record<string, typeof IconBook> = {
  'getting-started': IconRocket,
  'agentic-workflows': IconRobot,
  authoring: IconPencil,
  fundamentals: IconLayersIntersect,
  'design-foundations': IconPalette,
  'build--delivery': IconSettings
}

export default function GuideIndex({ pageCategories }: { pageCategories: GuideCategory[] }) {
  const tw = useLocale() === 'tw'
  const $ = useTranslation()
  const sections = guideOverviewSections(pageCategories).map(section => ({
    id: section.id,
    title: tw ? $(section.category) : section.title,
    description: tw ? section.descriptionTW : section.description,
    Icon: sectionIcons[section.id],
    legacyIds: section.id === 'getting-started' ? ['syntax-tutorial'] : [],
    groups: [{ entries: section.entries.map(entry => ({ ...entry, displayTitle: $(entry.title) })) }]
  }))
  return <DocumentationIndex name="guide" sections={sections} showDescriptions related={{
    href: '/reference', Icon: IconBook,
    title: tw ? '查閱 Reference' : 'Look up a reference',
    description: tw ? '查證語法、值、生成結果與工具用法。' : 'Check syntax, values, generated CSS and tool contracts.'
  }} />
}
