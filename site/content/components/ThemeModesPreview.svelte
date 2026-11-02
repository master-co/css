<script lang="ts">
  import type { Snippet } from 'svelte'
  import IconBackpack from '@tabler/icons-svelte-runes/icons/backpack'
  import IconChevronLeft from '@tabler/icons-svelte-runes/icons/chevron-left'
  import IconShoe from '@tabler/icons-svelte-runes/icons/shoe'
  import IconShoppingBag from '@tabler/icons-svelte-runes/icons/shopping-bag'
  import { getSite } from '@master/internal-site/site'
  import { mountThemeSplit } from './theme-split'

  /**
   * A light and dark rendering of the same markup on one artboard, compared with a draggable split.
   * The split is measured across the artboard, so the share it reports is the share of the screen each mode paints.
   */
  let { class: className }: { class?: string } = $props()
  const { t } = getSite()
  let root = $state<HTMLDivElement>()
  let frame = $state<HTMLDivElement>()

  $effect(() => {
    if (!root || !frame) return
    return mountThemeSplit(root, frame, (light, dark) => `${t('Light')} ${light}%, ${t('Dark')} ${dark}%`)
  })
</script>

<!-- The same markup in both copies; only the `light` or `dark` class on its root differs. -->
{#snippet shopScreen(mode: 'light' | 'dark')}
  <div class={['home-theme-screen', mode]}>
    <div class="flex flex-col gap-md p-lg r-3xl bg-surface-base fg-text-strong">
      <div class="flex items-center justify-between (height:var(--spacing-xl))">
        <IconChevronLeft size={18} stroke={1.75} />
        <span class="font-sm font-medium">{t('Shop')}</span>
        <span class="relative grid">
          <IconShoppingBag size={18} stroke={1.75} />
          <span class="absolute (right:-0.125rem) (top:-0.125rem) (height:0.4375rem) (width:0.4375rem) pill bg-surface-inverse"></span>
        </span>
      </div>
      <div>
        <p class="font-mono font-2xs tracking-wider uppercase fg-text-muted">{t('Sunday drop')}</p>
        <p class="mt-2xs font-2xl (line-height:1.1) tracking-tight fg-text-strong">{t('Find your daily kit.')}</p>
      </div>
      <div class="flex items-center gap-md font-xs">
        <span class="inline-flex items-center (height:1.75rem) px-sm pill font-medium bg-surface-inverse fg-text-inverse">{t('All')}</span>
        <span class="fg-text-muted">{t('Bags')}</span>
        <span class="fg-text-muted">{t('Shoes')}</span>
      </div>
      <div class="grid-cols(2) gap-sm">
        {@render product(backpack, t('Day pack'), '$84')}
        {@render product(shoe, t('Runner'), '$128')}
      </div>
    </div>
  </div>
{/snippet}

{#snippet backpack()}<IconBackpack size={26} stroke={1.25} />{/snippet}
{#snippet shoe()}<IconShoe size={26} stroke={1.25} />{/snippet}

<!-- A product as a picture and a line of text, with no card around it. -->
{#snippet product(icon: Snippet, label: string, price: string)}
  <div class="min-w(0)">
    <div class="grid (place-content:center) (height:5rem) r-xl bg-surface-inset fg-text-muted">{@render icon()}</div>
    <div class="flex items-baseline justify-between gap-xs mt-xs">
      <p class="truncate font-xs font-medium fg-text-strong">{label}</p>
      <span class="font-mono font-2xs fg-text-muted">{price}</span>
    </div>
  </div>
{/snippet}

<div bind:this={root} class={[className, 'home-dot-grid home-theme']}>
  <div
    aria-label={t('Preview theme mode split')}
    aria-valuemax={100}
    aria-valuemin={0}
    aria-valuenow={50}
    aria-valuetext={`${t('Light')} 50%, ${t('Dark')} 50%`}
    class="home-theme-slider"
    role="slider"
    style="--home-split: 50%"
    tabindex="0">
    <!-- An artboard: the class each copy carries above it, corner marks around it, the split measured below it. -->
    <div aria-hidden="true" class="home-theme-board">
      <p class="home-theme-labels"><code>.light</code><code>.dark</code></p>
      <div bind:this={frame} class="home-marks home-theme-artboard">
        <div class="home-theme-copy home-theme-copy-light">{@render shopScreen('light')}</div>
        <div class="home-theme-copy home-theme-copy-dark">{@render shopScreen('dark')}</div>
        <span class="home-theme-divider"></span>
        <!-- The page lamp writes its light onto the knob before or after hydration. -->
        <span class="home-lit home-stone home-stone-quiet home-theme-knob"></span>
      </div>
      <p class="home-theme-measure">
        <span class="home-theme-measure-label" style="left: 25%">50%</span>
        <span class="home-theme-measure-label" style="left: 75%">50%</span>
      </p>
    </div>
  </div>
</div>
