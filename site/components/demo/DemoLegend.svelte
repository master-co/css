<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { HTMLAttributes } from 'svelte/elements'
  import { styleText, type DemoStyle } from './style'
  import { tone, type DemoTone } from './tone'

  let { items, class: className, style, ...props }: Omit<HTMLAttributes<HTMLUListElement>, 'style' | 'children'> & {
    items: { label: string, tone: DemoTone }[]
    style?: DemoStyle
  } = $props()
</script>

<ul {...props} class={['ui-legend', className]} style={styleText(style)} aria-label="Legend">
  {#each items as { label, tone: value } (label)}<li><i data-tone={tone(value)} aria-hidden="true"></i>{label}</li>{/each}
</ul>
