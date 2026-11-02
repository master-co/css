<script lang="ts">
  import type { Snippet } from 'svelte'
  import IconChevronDown from '@tabler/icons-svelte-runes/icons/chevron-down'
  import { getSite } from '../site'

  /** A long surface clamped under a canvas fade; one quiet control shows the rest. */
  let { children }: { children?: Snippet } = $props()
  let expanded = $state(false)
  const id = $props.id()
  const { t } = getSite()
</script>

<div class="ui-expand" data-expanded={expanded}>
  <div {id}>{@render children?.()}</div>
  <div class="ui-expand-control">
    <button type="button" class="ui-button" data-size="sm" aria-expanded={expanded} aria-controls={id} onclick={() => { expanded = !expanded }}>
      {t(expanded ? 'Collapse' : 'Expand')}
      <IconChevronDown aria-hidden="true" stroke={1.5} />
    </button>
  </div>
</div>
