<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'
  import { tone, type DemoTone } from './tone'

  /** An inline category or state; keep it outside measured layouts. */
  let { tone: value = 'neutral', size = 'md', variant = 'soft', class: className, style, children, ...props }: Omit<HTMLAttributes<HTMLSpanElement>, 'style'> & {
    tone?: DemoTone
    size?: 'sm' | 'md'
    variant?: 'soft' | 'dot'
    style?: DemoStyle
    children?: Snippet
  } = $props()
</script>

<span {...props} data-tone={tone(value)} data-size={size === 'md' ? undefined : size} data-variant={variant === 'soft' ? undefined : variant} class={['ui-badge', className]} style={styleText(style)}>{@render children?.()}</span>
