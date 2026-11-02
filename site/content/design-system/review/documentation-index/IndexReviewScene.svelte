<script lang="ts">
  import DocumentationIndex, { type DocumentationIndexSection } from '~/site/components/DocumentationIndex.svelte'

  let { prefix }: { prefix: string } = $props()

  function sectionsFor(prefix: string): DocumentationIndexSection[] {
    return [
      { id: `${prefix}-learning`, title: 'Learn', description: 'Start with one complete example, then build on it.', groups: [{ entries: [
        { id: `${prefix}-intro`, title: 'Introduction', description: 'Write your first classes and choose a delivery mode.', category: 'Guide', url: '/guide/introduction' },
        { id: `${prefix}-tutorial`, title: 'Syntax tutorial', description: 'Build a button with states and conditions.', category: 'Guide', url: '/guide/syntax-tutorial' },
      ] }] },
      { id: `${prefix}-utilities`, title: 'Utilities', description: 'Look up a specific layout behavior.', groups: [
        { id: `${prefix}-flow`, title: 'Document flow', entries: [
          { id: `${prefix}-clear`, title: 'clear', category: 'Document flow', url: '/guide/layout-system' },
          { id: `${prefix}-display`, title: 'display', category: 'Document flow', url: '/guide/layout-system' },
        ] },
        { id: `${prefix}-layout`, title: 'Layout', entries: [
          { id: `${prefix}-flex`, title: 'flex', category: 'Layout', url: '/guide/layout-system#add-explicit-tracks-only-when-needed' },
          { id: `${prefix}-grid`, title: 'grid', category: 'Layout', url: '/guide/layout-system#add-explicit-tracks-only-when-needed' },
        ] },
      ] },
      { id: `${prefix}-foundations`, title: 'Foundations', description: 'Share values across the interface.', groups: [{ entries: [
        { id: `${prefix}-colors`, title: 'Colors', description: 'Use palette steps and semantic color roles.', category: 'Foundations', url: '/guide/colors' },
        { id: `${prefix}-spacing`, title: 'Spacing', description: 'Set a consistent rhythm with the spacing scale.', category: 'Foundations', url: '/guide/layout-system#namespace-for-spacing' },
      ] }] },
    ]
  }

  const related = { href: '/reference', title: 'Full Reference', description: 'Browse utilities, tokens and tools.' }
  const sections = $derived(sectionsFor(prefix))
</script>

<DocumentationIndex name="guide" idPrefix={prefix} {sections} showDescriptions {related} />
