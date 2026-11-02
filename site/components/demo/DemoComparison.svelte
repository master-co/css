<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface DemoComparisonItem {
    label: string | Snippet
    /** Text or a snippet. From `.astro` and `.mdx`, omit it and pass a named slot called `key` instead. */
    children?: string | Snippet
    key?: string
  }
</script>

<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'

  /** The same subject under named conditions: each item is a captioned stage. */
  let { items, class: className, style, ...rest }: Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'> & {
    items: DemoComparisonItem[]
    style?: DemoStyle
  } = $props()
  // Slot content arrives as snippet props named by each item's key; everything else is an attribute.
  const slots = $derived(new Set(items.flatMap(item => item.key == null ? [] : [item.key])))
  const props = $derived(Object.fromEntries(Object.entries(rest).filter(([name]) => !slots.has(name))))
  const content = (item: DemoComparisonItem) => item.children ?? (item.key == null ? undefined : (rest as Record<string, Snippet | undefined>)[item.key])
</script>

{#snippet node(value: string | Snippet | undefined)}{#if typeof value === 'function'}{@render value()}{:else}{value}{/if}{/snippet}

<div {...props} class={['ui-compare', className]} style={styleText(style)}>
  {#each items as item, index (item.key ?? index)}<figure>
    <figcaption>{@render node(item.label)}</figcaption>
    <div class="ui-stage">{@render node(content(item))}</div>
  </figure>{/each}
</div>
