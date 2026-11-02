<script module lang="ts">
  export type { DocumentationIndexEntry, DocumentationIndexSection } from './document-types'
</script>

<script lang="ts">
  import '~/site/styles/documentation-index.css'
  import Link from '~/site/docs-shell/components/Link.svelte'
  import { getSite } from '~/site/docs-shell/site'
  import type { DocumentationIndexEntry, DocumentationIndexSection } from './document-types'

  interface SectionLink {
    title: string
    description: string
    href: string
  }

  let { name, sections, related, showDescriptions = false, idPrefix }: {
    name: 'guide' | 'reference'
    sections: DocumentationIndexSection[]
    related: SectionLink
    showDescriptions?: boolean
    /** Scope anchor IDs when multiple catalogs are shown in one review. Omit on published indexes. */
    idPrefix?: string
  } = $props()

  const { locale, t } = getSite()
  const tw = locale === 'tw'
  let alphabetical = $state(false)
  const entries = $derived(sections.flatMap(section => section.groups.flatMap(group => group.entries)))
  const letters = $derived(Map.groupBy([...entries].sort((a, b) => a.title.localeCompare(b.title)), entry => /^[a-z]/i.test(entry.title) ? entry.title[0].toUpperCase() : '#'))
  const groupId = (section: DocumentationIndexSection, index: number) => section.groups[index].id ?? `${section.id}-group-${index + 1}`
  const sectionIds = $derived(sections.flatMap(section => [section.id, ...section.groups.map((_, index) => groupId(section, index))]).join(','))
  const panelId = (part: 'category' | 'alphabetical') => `${idPrefix ?? name}-${part}-index`
  const letterId = (letter: string) => `${idPrefix ? `${idPrefix}-` : ''}index-${letter === '#' ? 'symbols' : letter.toLowerCase()}`
  const letterHashPrefix = $derived(`#${idPrefix ? `${idPrefix}-` : ''}index-`)
  const count = (section: DocumentationIndexSection) => section.groups.reduce((total, group) => total + group.entries.length, 0)
  const ordinal = (index: number) => String(index + 1).padStart(2, '0')

  $effect(() => {
    const prefix = letterHashPrefix
    const ids = sectionIds.split(',')
    function syncView() {
      if (location.hash.startsWith(prefix) && /^(symbols|[a-z])$/.test(location.hash.slice(prefix.length))) alphabetical = true
      else if (ids.includes(location.hash.slice(1))) alphabetical = false
    }
    syncView()
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  })
  $effect(() => {
    void alphabetical
    const target = document.getElementById(location.hash.slice(1))
    if (target && !target.closest('[hidden]')) target.scrollIntoView({ block: 'start' })
  })
</script>

<!-- Described entries read as ruled rows with their summary; bare titles stay a quiet list of links. -->
{#snippet entryLinks(entries: DocumentationIndexEntry[], { columns = false, showCategory = false, showDescriptions = false } = {})}
  <ul class="documentation-index-links" data-columns={columns || undefined} data-described={showDescriptions || undefined}>
    {#each entries as entry (entry.id)}
      <li>
        <Link href={entry.url} disabled={entry.disabled} unfinished={entry.unfinished}>
          <b>{entry.displayTitle || entry.title}</b>
          {#if showDescriptions && entry.description}<span>{t(entry.description)}</span>{/if}
          {#if showCategory}<small>{t(entry.category)}</small>{/if}
        </Link>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="documentation-index">
  <!-- A contents list, not a second catalog: each section by its number, name and size; the sibling index closes it. -->
  <nav class="documentation-index-directory" aria-label={tw ? `${name === 'guide' ? 'Guide' : 'Reference'} 分區` : `${name === 'guide' ? 'Guide' : 'Reference'} sections`}>
    {#each sections as section, index (section.id)}
      <a href={`#${section.id}`} onclick={() => alphabetical = false}>
        <small>{ordinal(index)}</small>
        <b>{section.title}</b>
        <span class="documentation-index-count">{count(section)}</span>
      </a>
    {/each}
    <Link href={related.href} data-related="">
      <small aria-hidden="true">→</small>
      <b>{related.title}</b>
      <span>{related.description}</span>
    </Link>
  </nav>

  <div class="documentation-index-toolbar">
    <p>{tw ? (name === 'guide' ? '所有教學' : '所有條目') : (name === 'guide' ? 'All guides' : 'All entries')} <span class="documentation-index-count">{entries.length}</span></p>
    <div class="ui-segmented" data-variant="underline" role="group" aria-label={tw ? '索引顯示方式' : 'Index view'}>
      <button type="button" aria-pressed={!alphabetical} aria-controls={panelId('category')} onclick={() => alphabetical = false}>{tw ? '依分類' : 'By category'}</button>
      <button type="button" aria-pressed={alphabetical} aria-controls={panelId('alphabetical')} onclick={() => alphabetical = true}>A–Z</button>
    </div>
  </div>

  <div id={panelId('category')} hidden={alphabetical}>
    {#each sections as section, sectionIndex (section.id)}
      <section class="documentation-index-section" aria-labelledby={section.id}>
        <header>
          <small aria-hidden="true">{ordinal(sectionIndex)}</small>
          <h2 id={section.id}>{section.title} <span class="documentation-index-count">{count(section)}</span></h2>
          <p>{section.description}</p>
          {#if section.groups.length > 1}
            <nav class="documentation-index-groups" aria-label={tw ? `${section.title}分類` : `${section.title} categories`}>
              {#each section.groups as group, index (groupId(section, index))}
                <a href={`#${groupId(section, index)}`}>{group.title}</a>
              {/each}
            </nav>
          {/if}
        </header>
        {#if section.groups.length === 1}
          {@render entryLinks(section.groups[0].entries, { columns: !showDescriptions, showDescriptions })}
        {:else}
          <div class="documentation-index-categories">
            {#each section.groups as group, index (groupId(section, index))}
              <section aria-labelledby={groupId(section, index)}>
                <h3 id={groupId(section, index)}>{group.title} <span class="documentation-index-count">{group.entries.length}</span></h3>
                {@render entryLinks(group.entries, { columns: true })}
              </section>
            {/each}
          </div>
        {/if}
      </section>
    {/each}
  </div>

  <div id={panelId('alphabetical')} hidden={!alphabetical}>
    <nav class="documentation-index-letters" aria-label={tw ? '依字母跳轉' : 'Jump to a letter'}>
      {#each [...letters.keys()] as letter (letter)}
        <a href={`#${letterId(letter)}`}>{letter}</a>
      {/each}
    </nav>
    <!-- A book's index: letters run in columns, each title followed by its section. -->
    <div class="documentation-index-alphabet">
      {#each [...letters] as [letter, documents] (letter)}
        <section aria-labelledby={letterId(letter)}>
          <h2 id={letterId(letter)}>{letter}</h2>
          {@render entryLinks(documents, { showCategory: true })}
        </section>
      {/each}
    </div>
  </div>
</div>
