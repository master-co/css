<script lang="ts">
  import './home-editor-tab.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  let { children, class: className, ...props }: HTMLAttributes<HTMLSpanElement> & { children?: Snippet } = $props()
</script>

<span class={['home-editor-tab', className]} {...props}>{@render children?.()}</span>
