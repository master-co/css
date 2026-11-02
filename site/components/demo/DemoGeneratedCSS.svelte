<script lang="ts">
  import type { Snippet } from 'svelte'

  /** The complete generated stylesheet stays one native, closed disclosure under the source. */
  let { children }: { children?: Snippet } = $props()
</script>

<details class="ui-disclosure"><summary>Generated CSS</summary>{@render children?.()}</details>
