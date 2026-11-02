<script lang="ts">
  import DemoControls from '~/site/components/demo/DemoControls.svelte'
  import DemoLabel from '~/site/components/demo/DemoLabel.svelte'
  import DemoSurface from '~/site/components/demo/DemoSurface.svelte'
  import { useDemoViewTransition } from '~/site/components/demo/useDemoViewTransition.svelte'

  const views = [
    { id: 'overview', title: 'Overview', label: 'Workspace / 01', body: 'A shared workspace for the next release. Keep the plan, the work and the details together.' },
    { id: 'product', title: 'Product detail', label: 'Workspace / 02', body: 'The same panel and heading move into the next visual state. Their snapshot names remain stable.' },
    { id: 'settings', title: 'Settings', label: 'Workspace / 03', body: 'Update the view in place. The interface stays usable when animation is unavailable or motion is reduced.' },
  ]

  let activeId = $state('overview')
  const active = $derived(views.find(view => view.id === activeId)!)
  const transition = useDemoViewTransition()
</script>

<main class="wrap-anywhere p-md bg-surface-base fg-text-body">
  <DemoControls label="Choose a view" variant="segmented">
    {#each views as view (view.id)}
      <button type="button" aria-pressed={activeId === view.id}
        onclick={() => { if (view.id !== activeId) transition.run(() => { activeId = view.id }) }}>{view.title}</button>
    {/each}
  </DemoControls>
  <DemoSurface elevation="raised" class="mt-md p-lg view-panel">
    <DemoLabel>{active.label}</DemoLabel>
    <h1 class="mb(0) mt-sm text-2xl font-semibold view-heading">{active.title}</h1>
    <p class="mb(0) mt-md text-sm fg-text-muted">{active.body}</p>
  </DemoSurface>
  <p class="mb(0) mt-sm text-xs fg-text-muted" role="status">{active.title} · {transition.mode}</p>
</main>
