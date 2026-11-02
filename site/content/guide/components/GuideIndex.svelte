<script lang="ts">
  import { getSite } from '~/site/docs-shell/site'
  import DocumentationIndex from '~/site/components/DocumentationIndex.svelte'
  import { guideOverviewSections, type GuideCategory } from '~/site/utils/guide-overview'

  let { pageCategories }: { pageCategories: GuideCategory[] } = $props()
  const { locale, t } = getSite()
  const tw = locale === 'tw'
  const sections = $derived(guideOverviewSections(pageCategories).map(section => ({
    id: section.id,
    title: tw ? t(section.category) : section.title,
    description: tw ? section.descriptionTW : section.description,
    groups: [{ entries: section.entries.map(entry => ({ ...entry, displayTitle: t(entry.title) })) }]
  })))
</script>

<DocumentationIndex name="guide" {sections} showDescriptions related={{
  href: '/reference',
  title: tw ? '查閱 Reference' : 'Look up a reference',
  description: tw ? '查證語法、值、生成結果與工具用法。' : 'Check syntax, values, generated CSS and tool contracts.'
}} />
