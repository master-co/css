<script lang="ts">
import './copy-command.css'
  import { onDestroy } from 'svelte'
  import IconCheck from '@tabler/icons-svelte-runes/icons/check'
  import IconCopy from '@tabler/icons-svelte-runes/icons/copy'
  import IconSparkles from '@tabler/icons-svelte-runes/icons/sparkles'
  import { getSite } from '@master/internal-site/site'

  /**
   * A shell command with a copy button. With a `label`, the field names what it copies
   * (such as a prompt too long to show) and the clipboard receives `command` unchanged.
   */
  let { class: className, command, label, copyLabel, wrap = false }: { class?: string, command: string, label?: string, copyLabel?: string, wrap?: boolean } = $props()
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
  {#if label}
    <IconSparkles aria-hidden="true" class="home-command-icon" size={16} stroke={1.75} />
    <span class={wrap ? 'home-command-label wrap-anywhere min-w(0) whitespace-normal' : 'home-command-label truncate min-w(0)'}>{label}</span>
  {:else}
    <span aria-hidden="true" class="fg-text-muted">$</span>
    <code class={wrap ? 'wrap-anywhere min-w(0) whitespace-normal' : 'truncate min-w(0)'}>{command}</code>
  {/if}
  <button
    aria-label={status === 'copied' ? t('Copied') : copyLabel ?? t('Copy command')}
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
