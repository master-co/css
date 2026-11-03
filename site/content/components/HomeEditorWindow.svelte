<script lang="ts">
  import './home-window-surface.css'
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  /** Shared window material for the homepage editor and delivery workbench. */
  let { children, class: className, ...props }: HTMLAttributes<HTMLDivElement> & { children?: Snippet } = $props()
</script>

<div class={['home-editor-window home-window-surface', className]} {...props}>
  {@render children?.()}
  <span aria-hidden="true" class="home-edge-light home-lit"></span>
</div>
