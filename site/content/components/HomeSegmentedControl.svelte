<script lang="ts" module>
  export interface HomeSegmentedControlOption<Value extends string> {
    label: string
    value: Value
  }
</script>

<script lang="ts" generics="Value extends string">
  import type { HTMLAttributes } from 'svelte/elements'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange' | 'role'> {
    onValueChange: (value: Value) => void
    options: readonly HomeSegmentedControlOption<Value>[]
    value: Value
  }

  /** A pill track whose thumb slides to the chosen option, sized to that option's label. */
  let { class: className, onValueChange, options, value, ...props }: Props = $props()

  let track = $state<HTMLDivElement>()
  let thumb = $state<{ x: number, width: number }>()

  $effect(() => {
    // Measure again whenever the chosen option changes.
    void value
    if (!track) return
    const measure = () => {
      const active = track!.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (active) thumb = { x: active.offsetLeft, width: active.offsetWidth }
    }
    measure()
    // Fonts and container queries can change a label's width after the first paint.
    const resize = new ResizeObserver(measure)
    resize.observe(track)
    return () => resize.disconnect()
  })
</script>

<!-- The page lamp writes its light onto this element before or after hydration; the thumb only sets its own properties. -->
<div
  {...props}
  bind:this={track}
  class={['home-lit home-segmented-control', className]}
  data-ready={thumb ? '' : undefined}
  role="group"
  style:--home-segment-x={thumb ? `${thumb.x}px` : undefined}
  style:--home-segment-width={thumb ? `${thumb.width}px` : undefined}>
  <span aria-hidden="true" class="home-segmented-control-thumb"></span>
  {#each options as option (option.value)}
    {@const active = option.value === value}
    <button
      aria-pressed={active}
      class="home-segmented-control-option"
      onclick={() => {
        if (!active) onValueChange(option.value)
      }}
      type="button">
      {option.label}
    </button>
  {/each}
</div>
