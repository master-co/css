<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'

  /** A named role with its actual paint. class and style paint the face. */
  let { label, value, class: className, style, children, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
    label: string
    value?: string
    style?: DemoStyle
    children?: Snippet
  } = $props()
</script>

<figure class="ui-swatch">
  <div {...props} aria-hidden={props['aria-hidden'] ?? (children == null ? true : undefined)} class={['ui-swatch-paint', className]} style={styleText(style)}>{@render children?.()}</div>
  <figcaption><b>{label}</b>{#if value}<code>{value}</code>{/if}</figcaption>
</figure>
