<script lang="ts">
  import '~/site/styles/docs-shell/page-content.css'
  import Link from './Link.svelte'
  import PageContentProvider from './PageContentProvider.svelte'
  import PageContentList from './PageContentList.svelte'
  import type { PageContentItem } from './page-content.svelte'
  import { getSite } from '../site'

  interface Props {
    /** The page's contents; the rail owns their provider, so the list and its live mark hydrate as one island. */
    items: PageContentItem[]
    metadata: any
  }

  /**
   * The documentation rail (`ui-toc`): the page's contents and the source links. The rail stands still;
   * a list taller than the window scrolls inside it, so the source links stay in view under it.
   */
  let { items, metadata }: Props = $props()
  const { t } = getSite()
  let list = $state<HTMLOListElement>()
</script>

<nav aria-labelledby="page-content-label" class="ui-toc" data-rail="">
  <h4 id="page-content-label">{t('On this page')}</h4>
  <PageContentProvider {items}>
    <PageContentList bind:element={list} scrollContainer={list} />
  </PageContentProvider>
  <div class="ui-toc-actions">
    {#if metadata.sourcePath}<Link href={`https://github.com/master-co/css/blob/rc/${encodeURI(metadata.sourcePath)}`} indicate>
      {t('Edit this page')}
    </Link>{/if}
    <Link href={`https://github.com/master-co/css/issues/new?assignees=&labels=documentation&template=docs_request.yml&labels=docs&title=📄+${metadata.title.absolute || metadata.title}:+`} indicate>
      {t('Issue on this page')}
    </Link>
  </div>
</nav>
