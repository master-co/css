<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'

  /** `inline` and `block` take text, or a snippet (a named slot from `.astro` and `.mdx`). */
  let { inline = 'Main axis', block = 'Cross axis', children, class: className, style, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
    inline?: string | Snippet
    block?: string | Snippet
    style?: DemoStyle
    children?: Snippet
  } = $props()
</script>

{#snippet node(value: string | Snippet)}{#if typeof value === 'function'}{@render value()}{:else}{value}{/if}{/snippet}

<div {...props} class={['ui-axes', className]} style={styleText(style)}>
  <div class="ui-axes-inline"><span>{@render node(inline)}</span><span class="ui-axes-rule" aria-hidden="true"></span></div>
  <div class="ui-axes-block"><span>{@render node(block)}</span><span class="ui-axes-rule" aria-hidden="true"></span></div>
  <div class="ui-axes-content">{@render children?.()}</div>
</div>
