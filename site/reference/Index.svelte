<script lang="ts">
  import { getSite } from '@master/internal-site/site'
  import DocumentationIndex from '@master/internal-site/components/DocumentationIndex.svelte'
  import { referenceSections, type ReferenceDocument } from './types'

  type Entry = Pick<ReferenceDocument, 'id' | 'kind' | 'title' | 'description' | 'category' | 'url'>

  let { documents, categoryOrder }: { documents: Entry[]; categoryOrder: string[] } = $props()

  const { locale, t } = getSite()
  const tw = locale === 'tw'
  const sections = $derived(referenceSections.map(section => {
    const entries = documents.filter(doc => section.kinds.includes(doc.kind))
    const categories = [...new Set(entries.map(doc => doc.category))]
      .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
    return {
      id: section.id,
      title: tw ? section.titleTW : section.title,
      description: tw ? section.descriptionTW : section.description,
      groups: categories.map(category => ({ id: `${section.id}-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, title: t(category), entries: entries.filter(doc => doc.category === category) }))
    }
  }).filter(section => section.groups.length))
</script>

<DocumentationIndex name="reference" {sections} related={{
  href: '/guide',
  title: tw ? '從 Guide 開始' : 'Start with the Guide',
  description: tw ? '循序學習概念，並透過範例開始實作。' : 'Learn the concepts and build with step-by-step examples.'
}} />
