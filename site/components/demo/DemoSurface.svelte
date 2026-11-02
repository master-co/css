<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'

  /** A sheet on the stage. Geometry and padding stay with the example. */
  let { elevation = 'flat', class: className, style, children, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
    elevation?: 'flat' | 'raised'
    style?: DemoStyle
    children?: Snippet
  } = $props()
</script>

<div {...props} data-elevation={elevation === 'flat' ? 'flat' : '1'} class={['ui-sheet', className]} style={styleText(style)}>{@render children?.()}</div>
