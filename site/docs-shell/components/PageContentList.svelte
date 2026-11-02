<script lang="ts" module>
  const initializedPageContentScrollContainers = new WeakSet<HTMLElement>()

  /** A list longer than this folds every section but the one being read to its title. */
  const foldAfter = 12
</script>

<script lang="ts">
  import Link from './Link.svelte'
  import PageContentTitle from './PageContentTitle.svelte'
  import { usePageContent, type PageContentItem } from './page-content.svelte'
  import groupPageContent from '../utils/group-page-content'
  import { getSite } from '../site'

  interface Props {
    /** The list element, for a parent that scrolls the list itself. */
    element?: HTMLOListElement
    scrollContainer?: HTMLElement
    lang?: string
    translate?: boolean
  }

  /**
   * The live list inside a `PageContentProvider`, nested as `ui-toc` lists: the entry being read carries
   * `aria-current="location"`. With a scroll container, the current entry is kept in view inside it. Titles are
   * translated unless they come from the page's own (already localized) headings.
   */
  let { element = $bindable(), scrollContainer, lang, translate = true }: Props = $props()
  const pageContent = usePageContent()
  const { t, i18n, locale } = getSite()
  const { defaultLocale, hreflangOfLocale } = i18n
  const fold = $derived(pageContent.items.length > foldAfter && pageContent.items.some((item) => item.level === 3))

  // A title the page's language has no translation for is read in its source language.
  const langOf = (title: string) => translate && locale !== defaultLocale && !title.startsWith('`') && t(title) === title ? hreflangOfLocale?.[defaultLocale] ?? defaultLocale : undefined

  $effect(() => {
    const container = scrollContainer
    const currentId = pageContent.currentId
    const nav = currentId ? element?.querySelector<HTMLElement>(`[data-page-content-nav-id="${CSS.escape(currentId)}"]`) : undefined
    if (nav && container && container.scrollHeight > container.clientHeight) {
      const behavior: ScrollBehavior = initializedPageContentScrollContainers.has(container) && !matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'smooth'
        : 'instant' as ScrollBehavior

      // The current entry settles about a third of the way down the scrolling list.
      container.scrollTo({
        top: container.scrollTop + nav.getBoundingClientRect().top - container.getBoundingClientRect().top - container.clientHeight / 3,
        behavior
      })
      initializedPageContentScrollContainers.add(container)
    }
  })
</script>

<!-- The bootstrap script marks the live entry before hydration, so its attribute may differ from the first render. -->
{#snippet nav({ id, title, level }: PageContentItem)}
  <Link href={'#' + id} aria-current={pageContent.currentId === id ? 'location' : undefined} data-page-content-nav-id={id} data-level={level} lang={langOf(title)}>
    <PageContentTitle {title} translate={translate ? t : undefined} />
  </Link>
{/snippet}

<ol bind:this={element} {lang} data-fold={fold ? '' : undefined}>
  {#each groupPageContent(pageContent.items) as { item, children } (item.id)}
    <li>
      {@render nav(item)}
      {#if children.length > 0}<ol>{#each children as child (child.id)}<li>{@render nav(child)}</li>{/each}</ol>{/if}
    </li>
  {/each}
</ol>
