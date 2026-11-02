<script lang="ts">
  import DemoMeasure from '~/site/components/demo/DemoMeasure.svelte'
  import Demo from '~/site/components/demo/Demo.svelte'
  import DemoSurface from '~/site/components/demo/DemoSurface.svelte'

  const id = $props.id()
  const widthId = `${id}-width`
  const detailsId = `${id}-details`
  let requestedWidth = $state(300)
  let showDetails = $state(false)
</script>

<Demo title="Content bounds" background="grid" caption="The rule reports the actual rendered box. At narrow widths, the available space can be less than the requested width.">
  {#snippet controls()}
    <label class="ui-label" data-case="as-is" for={widthId}>Width · {requestedWidth} px</label>
    <input id={widthId} class="ui-range" type="range" min={180} max={460} step={20} bind:value={requestedWidth}
      style:--value={`${((requestedWidth - 180) / 280) * 100}%`} style:width="128px" style:max-width="100%" />
    <label class="ui-check" for={detailsId}>
      <input id={detailsId} type="checkbox" bind:checked={showDetails} />
      Add detail
    </label>
  {/snippet}
  <div style:width={`min(100%, ${requestedWidth}px)`}>
    <DemoMeasure label="Content bounds">
      <DemoSurface elevation="raised" class="grid gap-xs p-md">
        <strong class="text-sm fg-text-strong">Collection panel</strong>
        <p class="m(0) text-sm">The subject stays inside its measured boundary.</p>
        {#if showDetails}<p class="m(0) text-sm">Additional fields appear beneath the summary. Their content wraps naturally at narrow widths and increases the panel’s measured height.</p>{/if}
      </DemoSurface>
    </DemoMeasure>
  </div>
</Demo>
