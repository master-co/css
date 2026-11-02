<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'
  import { tone, type DemoTone } from './tone'

  /** A tile that stands for content. Utilities on the item set its size and layout. */
  let { tone: value = 'neutral', variant = 'soft', class: className, style, children, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
    tone?: DemoTone
    variant?: 'soft' | 'solid' | 'outline' | 'ghost'
    style?: DemoStyle
    children?: Snippet
  } = $props()
</script>

<div {...props} data-tone={tone(value)} data-variant={variant === 'soft' ? undefined : variant} class={['ui-item', className]} style={styleText(style)}>{@render children?.()}</div>
