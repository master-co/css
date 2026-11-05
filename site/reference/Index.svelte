<script lang="ts">
  import { getSite } from '@master/internal-site/site'
  import DocumentationIndex from '@master/internal-site/components/DocumentationIndex.svelte'
  import type { ReferenceDocument, ReferenceKind } from './types'

  type Entry = Pick<ReferenceDocument, 'id' | 'kind' | 'title' | 'description' | 'category' | 'url'>

  let { documents, categoryOrder, sections: sourceSections, related }: { documents: Entry[]; categoryOrder: string[]; sections: { id: string; title: string; description: string; kinds: ReferenceKind[] }[]; related: { href: string; title: string; description: string } } = $props()

  const { t } = getSite()
  const sections = $derived(sourceSections.map(section => {
    const entries = documents.filter(doc => section.kinds.includes(doc.kind))
    const categories = [...new Set(entries.map(doc => doc.category))]
      .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      groups: categories.map(category => ({ id: `${section.id}-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, title: t(category), entries: entries.filter(doc => doc.category === category) }))
    }
  }).filter(section => section.groups.length))
</script>

<DocumentationIndex name="reference" {sections} {related} />
