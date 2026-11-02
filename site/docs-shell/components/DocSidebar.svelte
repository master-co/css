<script lang="ts" module>
  import type { DefinedMetadata } from '../types/Metadata'

  export interface DocSidebarProps {
    pageCategories: {
      name: string,
      pages: (Pick<DefinedMetadata, 'pathname' | 'title'> & Partial<DefinedMetadata>)[]
    }[],
    includeNestedPages?: boolean
    /** Inside the compact menu: the groups only, without the documentation landmark. */
    embedded?: boolean
    onNavigate?: () => void
  }
</script>

<script lang="ts">
  import Link from './Link.svelte'
  import { getSite } from '../site'

  /** The documentation sidebar: one navigation group per category; the page being read inks a bar on the guide. Search lives in the header. */
  let { pageCategories, includeNestedPages = false, embedded = false, onNavigate }: DocSidebarProps = $props()
  const { t, locale } = getSite()
  const tw = locale === 'tw'
  const groups = $derived(pageCategories
    .filter((eachPageCategory: any) => eachPageCategory.name !== 'Overview')
    .map((eachPageCategory: any) => ({
      name: eachPageCategory.name,
      pages: eachPageCategory.pages.filter((metadata: any) => includeNestedPages || metadata.pathname.split('/').length === 3)
    }))
    .filter(({ pages }) => pages.length !== 0))
</script>

{#snippet sidebarGroups()}
  {#each groups as eachPageCategory (eachPageCategory.name)}
    {@const name = t(eachPageCategory.name)}
    <nav class="ui-nav-group" aria-label={name}>
      <h4>{name}</h4>
      {#each eachPageCategory.pages as metadata (metadata.pathname)}
        {@const translatedTitle = t(metadata.other?.subject || metadata.title.absolute || metadata.title)}
        <Link class="ui-nav-link"
          current="true"
          ambiguous
          href={metadata.pathname}
          scrollIntoView
          disabled={metadata.disabled}
          unfinished={metadata.unfinished}
          onclick={onNavigate}>
          {t(translatedTitle)}
          {#if metadata.type === 'entity' && locale !== 'en' && translatedTitle !== metadata.title}<small translate="no">{metadata.title}</small>{/if}
        </Link>
      {/each}
    </nav>
  {/each}
{/snippet}

{#if embedded}
  <div class="ui-sidebar">{@render sidebarGroups()}</div>
{:else}
  <aside id="sidebar" aria-label={tw ? '文件導覽' : 'Documentation navigation'} class="ui-sidebar">
    {@render sidebarGroups()}
  </aside>
{/if}
