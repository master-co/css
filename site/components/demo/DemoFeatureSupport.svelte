<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import { onMount } from 'svelte'

  /** Reports syntax support only; the example still owns its native CSS behavior. */
  let { condition }: { condition: string } = $props()
  // The server and the first client render agree on "unknown"; the browser answers after mount.
  let mounted = $state(false)
  onMount(() => { mounted = true })
  const supported = $derived(mounted ? CSS.supports(condition) : null)
</script>

<p class="flex flex-wrap items-center gap-xs m(0)" data-supported={supported ?? 'unknown'}>
  <code class="ui-inline-code">{condition}</code>
  <span class="ui-badge" data-variant="dot" data-tone={supported ? 'green' : undefined}>
    {supported === null ? 'Checking…' : supported ? 'Supported' : 'Not supported'}
  </span>
</p>
