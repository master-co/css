<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'

  /** A labelled group of controls. `segmented` draws the sunken track with raised selected buttons. */
  let { label = 'Demo controls', variant = 'plain', class: className, style, children, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
    label?: string
    variant?: 'plain' | 'segmented'
    style?: DemoStyle
    children?: Snippet
  } = $props()
</script>

<div {...props} role="group" aria-label={label} class={[variant === 'segmented' ? 'ui-segmented' : 'flex flex-wrap items-center gap-xs', className]} style={styleText(style)}>{@render children?.()}</div>
