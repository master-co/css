<script lang="ts">
  import Demo from '~/site/components/demo/Demo.svelte'
  import DemoControls from '~/site/components/demo/DemoControls.svelte'
  import DemoItem from '~/site/components/demo/DemoItem.svelte'
  import DemoLegend from '~/site/components/demo/DemoLegend.svelte'

  const options = [
    { value: 'items-flex-start', label: 'Start' },
    { value: 'items-center', label: 'Center' },
    { value: 'items-flex-end', label: 'End' }
  ] as const

  let alignment = $state<(typeof options)[number]['value']>('items-flex-start')
</script>

<Demo title="Cross-axis alignment" background="grid" caption="Selection changes the actual alignment utility on the flex parent. Scroll the preview horizontally when space is limited.">
  {#snippet controls()}
    <DemoControls label="Cross-axis alignment" variant="segmented">
      {#each options as { value, label } (value)}
        <button type="button" aria-pressed={alignment === value} onclick={() => alignment = value}>{label}</button>
      {/each}
    </DemoControls>
  {/snippet}
  <div class="grid gap-md w-full">
    <!-- Keyboard focus enables native horizontal scrolling. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="overflow-x-auto w-full p(4)" role="region" aria-label="Alignment preview" tabindex="0" data-preview-scroll="">
      <div class={`flex gap-sm (min-width:18rem) (height:10rem) ${alignment}`}>
        <DemoItem tone="blue" class="(flex:1)">01</DemoItem>
        <DemoItem tone="violet" class="(flex:1) (height:6rem)">02</DemoItem>
        <DemoItem class="(flex:1)">03</DemoItem>
      </div>
    </div>
    <DemoLegend class="justify-center" items={[{ label: 'Subject', tone: 'blue' }, { label: 'Taller comparison', tone: 'violet' }, { label: 'Context', tone: 'neutral' }]} />
  </div>
</Demo>
