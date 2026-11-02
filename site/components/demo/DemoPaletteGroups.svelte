<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import DemoCopyButton from './DemoCopyButton.svelte'
  import DemoCopyGroup from './DemoCopyGroup.svelte'

  /** DemoPalette's chips: one copy group, so every chip reports to the same status. */
  let { groups }: { groups: { family: string, colors: { name: string, value: string }[] }[] } = $props()
</script>

<div class="w-full"><DemoCopyGroup><div class="ui-palette">
  {#each groups as { family, colors } (family)}<div class="ui-palette-row" role="group" aria-label={`${family} palette`}>
    <span>{family}</span>
    {#each colors as { name, value } (name)}<DemoCopyButton value={`var(--${name})`} label={`Copy ${name}`} icon={null} class="ui-palette-chip" style={`background-color:${value}`} title={`${name}: ${value}`} />{/each}
  </div>{/each}
</div></DemoCopyGroup></div>
