<script lang="ts">
  import Image from '~/site/docs-shell/components/Image.svelte'
  import IconArrowLeft from '@tabler/icons-svelte-runes/icons/arrow-left'
  import IconArrowUpRight from '@tabler/icons-svelte-runes/icons/arrow-up-right'
  import DemoLabel from '~/site/components/demo/DemoLabel.svelte'
  import DemoSurface from '~/site/components/demo/DemoSurface.svelte'
  import { useDemoViewTransition } from '~/site/components/demo/useDemoViewTransition.svelte'
  import articleAuroraImage from '~/site/assets/images/view-transitions/article-aurora.jpg'
  import articleStudioImage from '~/site/assets/images/view-transitions/article-studio.jpg'

  const articles = [
    {
      id: 'aurora',
      title: 'Designing transitions that preserve context',
      date: 'May 12, 2026',
      description: 'A practical pattern for moving readers from a dense article feed into a focused story view.',
      image: articleAuroraImage,
      imageAlt: 'Green mountain ridge with a winding road',
    },
    {
      id: 'studio',
      title: 'Building quieter detail pages',
      date: 'May 9, 2026',
      description: 'How shared element motion helps a page change feel intentional without adding visual noise.',
      image: articleStudioImage,
      imageAlt: 'Snowy mountain valley with yellow tents',
    },
  ]

  let selectedId = $state<string>()
  const selected = $derived(articles.find(article => article.id === selectedId))
  let heading = $state<HTMLHeadingElement>()
  const buttons = new Map<string, HTMLButtonElement>()
  const transition = useDemoViewTransition()

  /** Keep each card's button so focus can return to it from the detail view. */
  function cardButton(id: string) {
    return (element: HTMLButtonElement) => {
      buttons.set(id, element)
      return () => { buttons.delete(id) }
    }
  }
</script>

<main class="container-inline p-md bg-surface-base fg-text-body">
  <div class="flex flex-wrap items-baseline justify-between gap-xs mb-md">
    <DemoLabel>Field notes / Collection 01</DemoLabel>
    <span class="text-xs fg-text-muted" role="status">{selected ? 'Article detail' : '2 articles'} · {transition.mode}</span>
  </div>
  {#if selected}
    <article data-article-detail class="overflow-hidden ui-sheet" data-elevation="1">
      <Image alt={selected.imageAlt} src={selected.image} loading="eager" sizes="(max-width: 600px) 100vw, 600px"
        style={`view-transition-name:article-${selected.id}-image`} class="block h-auto w-full (aspect-ratio:16/9) object-cover article-capture" />
      <div class="p-lg">
        <time datetime={selected.id === 'aurora' ? '2026-05-12' : '2026-05-09'} style={`view-transition-name:article-${selected.id}-date`} class="text-xs fg-text-muted article-capture">{selected.date}</time>
        <h1 bind:this={heading} tabindex="-1" style={`view-transition-name:article-${selected.id}-title`} class="mb(0) mt-sm text-2xl font-regular outline-solid:focus-visible outline(2):focus-visible outline-text-link:focus-visible outline-offset-4xs:focus-visible article-capture">{selected.title}</h1>
        <p class="mb(0) mt-md text-sm fg-text-muted">{selected.description} The image, title and date keep their names in both views. Each snapshot can move to its new bounds while surrounding content fades.</p>
        <button type="button" class="mt-lg ui-button" onclick={() => { const id = selected.id; transition.run(() => { selectedId = undefined }, () => buttons.get(id) ?? null) }}>
          <IconArrowLeft aria-hidden="true" />Back to collection
        </button>
      </div>
    </article>
  {:else}
    <div class="grid-cols(1) grid gap-md grid-cols(2)@container(width>=28rem)">
      {#each articles as article (article.id)}
        <DemoSurface elevation="raised" class="flex overflow-hidden flex-col">
          <Image alt={article.imageAlt} src={article.image} loading="eager" sizes="(max-width: 600px) 100vw, 600px"
            style={`view-transition-name:article-${article.id}-image`} class="block h-auto w-full (aspect-ratio:16/10) object-cover article-capture" />
          <article class="flex flex-col (flex:1) p-md">
            <time datetime={article.id === 'aurora' ? '2026-05-12' : '2026-05-09'} style={`view-transition-name:article-${article.id}-date`} class="text-xs fg-text-muted article-capture">{article.date}</time>
            <h2 style={`view-transition-name:article-${article.id}-title`} class="mb(0) mt-xs text-lg font-regular article-capture">{article.title}</h2>
            <p class="mb-md mt-sm text-sm fg-text-muted">{article.description}</p>
            <button {@attach cardButton(article.id)}
              type="button" class="self-start mt-auto ui-button" aria-label={`Read ${article.title}`}
              onclick={() => transition.run(() => { selectedId = article.id }, () => heading ?? null)}>
              Read article<IconArrowUpRight aria-hidden="true" />
            </button>
          </article>
        </DemoSurface>
      {/each}
    </div>
  {/if}
</main>
