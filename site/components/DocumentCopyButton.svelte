<script lang="ts">
  import { onMount } from 'svelte'
  import IconCheck from '@tabler/icons-svelte-runes/icons/check'
  import IconCopy from '@tabler/icons-svelte-runes/icons/copy'

  /** Content stays server-rendered; only clipboard feedback needs client state. */
  let { text, label }: { text: string, label: string } = $props()

  let result = $state<'success' | 'error'>()
  // Disabled in the server HTML until hydration can handle the click.
  let ready = $state(false)

  let timer: ReturnType<typeof setTimeout> | undefined

  onMount(() => {
    ready = true
    return () => clearTimeout(timer)
  })

  async function copy() {
    clearTimeout(timer)
    try {
      await navigator.clipboard.writeText(text)
      result = 'success'
      // Success feedback clears itself; an error stays until the next attempt.
      timer = setTimeout(() => result = undefined, 2000)
    } catch {
      result = 'error'
    }
  }
</script>

<span class="ui-copy">
  <button type="button" class="ui-button" data-size="sm" disabled={!ready} aria-label={`Copy ${label}`} onclick={copy}>
    {#if result === 'success'}<IconCheck stroke={1.8} aria-hidden="true" />{:else}<IconCopy stroke={1.8} aria-hidden="true" />{/if}
    Copy
  </button>
  <span class="ui-copy-status" role="status" data-result={result}>
    {#if result === 'success'}Copied<span class="sr-only"> {label}</span>{:else if result === 'error'}Clipboard unavailable. Select the text to copy it.{/if}
  </span>
</span>
