<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import IconCopy from '@tabler/icons-svelte-runes/icons/copy'
  import { getCopyFeedback, type CopyResult } from './copy-feedback'
  import { styleText, type DemoStyle } from './style'

  interface Props extends Omit<HTMLButtonAttributes, 'onclick' | 'value' | 'style' | 'children'> {
    value: string
    label: string
    /** Replaces the copy icon; `null` renders none. */
    icon?: Snippet | null
    /** Short status for a specimen that already displays the copied value. */
    feedback?: 'value' | 'compact'
    style?: DemoStyle
    children?: Snippet
  }

  /** The visible status describes the actual clipboard result, including denial. */
  let { value, label, icon, feedback = 'value', children, class: className, style, ...props }: Props = $props()
  const notify = getCopyFeedback()
  let status = $state<{ message: string, result: CopyResult }>({ message: '', result: undefined })
  let busy = $state(false)
  const report = notify ?? ((message: string, result: CopyResult) => { status = { message, result } })
  async function copy() {
    if (busy) return
    busy = true
    report('Copying…', undefined)
    try {
      if (!window.isSecureContext || !navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(value)
      report(feedback === 'compact' ? 'Copied' : `Copied ${value}`, 'success')
    } catch {
      report(feedback === 'compact' ? 'Copy unavailable' : `Copy unavailable: ${value}`, 'error')
    } finally { busy = false }
  }
</script>

{#snippet button()}
  <button data-size={className ? undefined : 'sm'} {...props} type="button" aria-label={label} class={className ?? 'ui-button'} style={styleText(style)} aria-busy={busy} onclick={copy}>
    {#if icon === undefined}<IconCopy aria-hidden="true" />{:else if icon}{@render icon()}{/if}{@render children?.()}
  </button>
{/snippet}

<!-- Grouped buttons report to the shared status and stay direct children of their layout. -->
{#if notify}
  {@render button()}
{:else}
  <span class="ui-copy">{@render button()}<span class="ui-copy-status" role="status" data-result={status.result}>{status.message}</span></span>
{/if}
