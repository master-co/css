<script lang="ts">
  import { onDestroy } from 'svelte'
  import IconCheck from '@tabler/icons-svelte-runes/icons/check'
  import IconCopy from '@tabler/icons-svelte-runes/icons/copy'
  import { getSite } from '~/site/docs-shell/site'

  /** A shell command with a copy button. */
  let { class: className, command, wrap = false }: { class?: string, command: string, wrap?: boolean } = $props()
  const { t } = getSite()
  let status = $state<'idle' | 'copied' | 'failed'>('idle')
  let timeout: ReturnType<typeof setTimeout> | undefined

  // A result shows for a moment, then the button returns to its resting label.
  function report(result: 'copied' | 'failed') {
    status = result
    clearTimeout(timeout)
    timeout = setTimeout(() => { status = 'idle' }, 1800)
  }

  onDestroy(() => clearTimeout(timeout))

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      report('copied')
    } catch {
      report('failed')
    }
  }
</script>

<div class={['home-command home-glass', className]} data-status={status}>
  <span aria-hidden="true" class="fg-text-muted">$</span>
  <code class={wrap ? 'wrap-anywhere min-w(0) whitespace-normal' : 'truncate min-w(0)'}>{command}</code>
  <button
    aria-label={status === 'copied' ? t('Copied') : t('Copy command')}
    class="home-command-copy"
    onclick={copy}
    type="button">
    {#if status === 'copied'}
      <IconCheck aria-hidden="true" size={16} stroke={2} />
    {:else}
      <IconCopy aria-hidden="true" size={16} stroke={1.75} />
    {/if}
  </button>
  <span aria-live="polite" class="sr-only">{status === 'copied' ? t('Copied') : status === 'failed' ? t('Copy failed') : ''}</span>
</div>
