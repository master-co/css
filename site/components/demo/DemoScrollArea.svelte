<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'

  /** A local, keyboard-reachable scroll region. Name it with aria-label. */
  let { class: className, tabindex = 0, style, children, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
    style?: DemoStyle
    children?: Snippet
  } = $props()
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div {...props} {tabindex} class={['ui-scroll', className]} style={styleText(style)}>{@render children?.()}</div>
