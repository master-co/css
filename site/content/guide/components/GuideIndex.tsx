'use client'

import { useLocale } from '~/site/docs-shell/contexts/locale'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import DocumentationIndex from '~/site/components/DocumentationIndex'
import { guideOverviewSections, type GuideCategory } from '~/site/utils/guide-overview'

export default function GuideIndex({ pageCategories }: { pageCategories: GuideCategory[] }) {
  const tw = useLocale() === 'tw'
  const $ = useTranslation()
  const sections = guideOverviewSections(pageCategories).map(section => ({
    id: section.id,
    title: tw ? $(section.category) : section.title,
    description: tw ? section.descriptionTW : section.description,
    groups: [{ entries: section.entries.map(entry => ({ ...entry, displayTitle: $(entry.title) })) }]
  }))
  return <DocumentationIndex name="guide" sections={sections} showDescriptions related={{
    href: '/reference',
    title: tw ? '查閱 Reference' : 'Look up a reference',
    description: tw ? '查證語法、值、生成結果與工具用法。' : 'Check syntax, values, generated CSS and tool contracts.'
  }} />
}
