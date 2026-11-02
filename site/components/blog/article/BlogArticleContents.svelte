<script lang="ts">
  import '~/site/styles/docs-shell/page-content.css'
  import PageContentList from '~/site/docs-shell/components/PageContentList.svelte'
  import PageContentProvider from '~/site/docs-shell/components/PageContentProvider.svelte'
  import type { PageContentItem } from '~/site/docs-shell/components/page-content.svelte'

  /**
   * The post's contents in the page's left margin: the documentation's contents ruler (the same list, the same live
   * mark, the same scroll tracking), under a label in the reader's language. A list taller than the window scrolls on
   * its own and keeps the current entry in view. `lang` names the language of the section titles when the post is not
   * yet translated.
   */
  let { items, label, lang }: { items: PageContentItem[], label: string, lang?: string } = $props()
  let nav = $state<HTMLElement>()
</script>

<nav bind:this={nav} class="blog-article-contents ui-toc" aria-label={label}>
  <!-- The visible label repeats the landmark's name, so assistive technology reads it once. -->
  <!-- svelte-ignore a11y_hidden -->
  <h4 aria-hidden="true">{label}</h4>
  <PageContentProvider {items}>
    <PageContentList {lang} translate={false} scrollContainer={nav} />
  </PageContentProvider>
</nav>
