<script lang="ts">
  import DocSidebar, { type DocSidebarProps } from '@master/internal-site/components/DocSidebar.svelte'

  let { pageCategories }: Pick<DocSidebarProps, 'pageCategories'> = $props()

  // Open the disclosures around the linked entry, then bring it into view; again on every hash change.
  $effect(() => {
    function reveal() {
      const id = decodeURIComponent(location.hash.slice(1))
      const target = id && document.getElementById(id)
      if (!target) return
      let parent = target.parentElement
      while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement }
      if (id) target.scrollIntoView({ block: 'start' })
    }
    reveal()
    window.addEventListener('hashchange', reveal)
    return () => window.removeEventListener('hashchange', reveal)
  })
</script>

<DocSidebar {pageCategories} includeNestedPages />
