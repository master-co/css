<script lang="ts">
  import { getSite } from '@master/internal-site/site'
  import DocumentationIndex from '@master/internal-site/components/DocumentationIndex.svelte'
  import { guideOverviewSections, type GuideCategory } from '~/site/utils/guide-overview'

  let { pageCategories }: { pageCategories: GuideCategory[] } = $props()
  const { t } = getSite()
  const sections = $derived(guideOverviewSections(pageCategories).map(section => ({
    id: section.id,
    title: t(section.title),
    description: t(section.description),
    groups: [{ entries: section.entries.map(entry => ({ ...entry, displayTitle: t(entry.title) })) }]
  })))
</script>

<DocumentationIndex name="guide" {sections} showDescriptions related={{
  href: '/reference',
  title: t('Look up a reference'),
  description: t('Check syntax, values, generated CSS and tool contracts.')
}} />
