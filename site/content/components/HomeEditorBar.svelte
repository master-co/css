<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  let { children, class: className, ...props }: HTMLAttributes<HTMLDivElement> & { children?: Snippet } = $props()
</script>

<div class={['home-editor-bar', className]} {...props}>{@render children?.()}</div>
