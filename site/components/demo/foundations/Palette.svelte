<script module lang="ts">
  export interface PaletteGroup { family: string; colors: { name: string; step: number; value: string }[] }
</script>

<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import '~/site/styles/demo.css'
  import DemoCopyButton from '../DemoCopyButton.svelte'
  import DemoCopyGroup from '../DemoCopyGroup.svelte'

  /** Wide pages show a hue matrix; narrow pages wrap each hue into two rows. Every chip names its step. */
  let { groups }: { groups: PaletteGroup[] } = $props()
  let format = $state('value')
  const id = $props.id()
  const endId = `${id}-end`
</script>

<div class="w-full"><DemoCopyGroup instruction={format === 'value' ? 'Choose a swatch to copy its original CSS color value.' : 'Choose a swatch to copy its CSS variable reference.'}>
  <label class="w-fit ui-field" for={id}>Copy as
    <select {id} class="ui-select" data-variant="raised" bind:value={format}>
      <option value="value">CSS value</option><option value="variable">CSS variable</option>
    </select>
  </label>
  <a class="ui-skip" href={`#${endId}`}>Skip color swatches</a>
  <div class="ui-palette">
    {#each groups as group (group.family)}<div class="ui-palette-row" role="group" aria-label={`${group.family} palette`}>
      <span>{group.family}</span>
      {#each group.colors as color (color.name)}<div class="ui-palette-cell">
        <DemoCopyButton icon={null} class="ui-palette-chip" style={`background-color:${color.value}`}
          value={format === 'value' ? color.value : `var(--${color.name})`}
          label={`Copy ${color.name} ${format === 'value' ? 'CSS value' : 'CSS variable'}`} title={`${color.name}: ${color.value}`} />
        <span aria-hidden="true">{color.step}</span>
      </div>{/each}
    </div>{/each}
  </div>
  <div id={endId} tabindex="-1"><span class="sr-only">End of color palette</span></div>
</DemoCopyGroup></div>
