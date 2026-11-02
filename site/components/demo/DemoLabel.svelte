<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'

  /** Names a condition outside the measured layout. Class names and values keep their case unless `upper` is set. */
  let { upper = false, class: className, style, children, ...props }: Omit<HTMLAttributes<HTMLSpanElement>, 'style'> & {
    upper?: boolean
    style?: DemoStyle
    children?: Snippet
  } = $props()
</script>

<span {...props} data-case={upper ? undefined : 'as-is'} class={['ui-label', className]} style={styleText(style)}>{@render children?.()}</span>
