<script lang="ts">
  import type { Snippet } from 'svelte'
  import { setCopyFeedback, type CopyResult } from './copy-feedback'

  /** One status for a set of copy actions, such as a palette. The buttons must render in this group's Svelte tree. */
  let { children, instruction = 'Select a swatch to copy its variable.' }: { children?: Snippet, instruction?: string } = $props()
  let state = $state<{ instruction: string, message: string, result: CopyResult }>()
  const current = $derived(state?.instruction === instruction ? state : undefined)
  setCopyFeedback((message, result) => { state = { instruction, message, result } })
</script>

<div class="grid gap-sm">
  <p class="m(0) ui-copy"><span class="ui-copy-status" role="status" data-result={current?.result}>{current?.message ?? instruction}</span></p>
  {@render children?.()}
</div>
