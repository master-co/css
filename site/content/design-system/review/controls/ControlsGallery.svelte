<script lang="ts">
  import IconCopy from '@tabler/icons-svelte-runes/icons/copy'
  import IconPlus from '@tabler/icons-svelte-runes/icons/plus'
  import Demo from '~/site/components/demo/Demo.svelte'
  import DemoLabel from '~/site/components/demo/DemoLabel.svelte'

  /** Every control in its resting state, with the states that documentation shows statically named by data-state. */
  let range = $state(40)
  let view = $state('Preview')
  const id = $props.id()
</script>

<Demo title="Buttons" description="Default, primary and quiet; hover lifts, pressing sinks" caption="The static hover and pressed specimens use data-state; real buttons use native :hover, :active and :focus-visible.">
  <div class="grid (justify-items:center) gap-lg">
    <div class="flex flex-wrap justify-center gap-sm">
      <button type="button" class="ui-button">Default</button>
      <button type="button" class="ui-button" data-variant="primary">Primary</button>
      <button type="button" class="ui-button" data-variant="quiet">Quiet</button>
      <button type="button" class="ui-button" disabled>Disabled</button>
      <button type="button" class="ui-button" data-shape="icon" aria-label="Add"><IconPlus aria-hidden="true" /></button>
    </div>
    <div class="flex flex-wrap items-end justify-center gap-sm">
      {#each ['hover', 'pressed', 'focus'] as const as state (state)}
        <div class="grid (justify-items:center) gap-xs">
          <span class="ui-button" data-state={state} aria-hidden="true">Save</span><DemoLabel>{state}</DemoLabel>
        </div>
      {/each}
      <div class="grid (justify-items:center) gap-xs"><span class="ui-button" data-size="sm" aria-hidden="true"><IconCopy aria-hidden="true" />Small</span><DemoLabel>data-size=&quot;sm&quot;</DemoLabel></div>
    </div>
  </div>
</Demo>
<Demo title="Choices and fields" description="Selected segments rise inside a sunken track; fields float back to the sheet on focus" padding="sm">
  <div class="grid gap-lg w-full max-w-md py-lg">
    <div class="w-fit ui-segmented" role="group" aria-label="View">
      {#each ['Preview', 'Code', 'Output'] as name (name)}
        <button type="button" aria-pressed={view === name} onclick={() => view = name}>{name}</button>
      {/each}
    </div>
    <label class="ui-field">Collection name<input class="ui-input" placeholder="Field notes" /><span class="ui-field-hint">Shown above the cards.</span></label>
    <label class="ui-field">Sort by<select class="ui-select"><option value="recent" selected>Most recent</option><option value="name">Name</option></select></label>
    <div class="grid gap-xs">
      <label class="ui-label" data-case="as-is" for={id}>Width · {range}%</label>
      <input {id} class="ui-range" type="range" min={0} max={100} bind:value={range} style:--value={`${range}%`} />
    </div>
    <div class="flex flex-wrap gap-lg">
      <label class="ui-check"><input type="checkbox" checked />Show captions</label>
      <label class="ui-check"><input type="radio" name={`${id}-density`} checked />Comfortable</label>
      <label class="ui-check"><input type="radio" name={`${id}-density`} />Compact</label>
      <label class="ui-check"><input type="checkbox" role="switch" class="ui-switch" checked />Sync</label>
    </div>
  </div>
</Demo>
