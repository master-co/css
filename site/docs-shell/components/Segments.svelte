<script lang="ts">
  import '~/site/styles/docs-shell/segments.css'
  import type { Snippet } from 'svelte'

  interface Props {
    /** The views' names, in order. Each view's content is the snippet (a named slot from Astro) of the same name. */
    names: readonly string[]
    label?: string
    [segment: string]: Snippet | readonly string[] | string | undefined
  }

  /** Related document views stay available in the HTML, including without scripting. */
  let { names, label = 'Document view', ...segments }: Props = $props()
  const prefix = $props.id()
  const buttons: (HTMLButtonElement | undefined)[] = []
  // The first view opens; the choice is the reader's after that.
  // svelte-ignore state_referenced_locally
  let activeName = $state(names[0])
  const activeIndex = $derived(Math.max(0, names.findIndex(name => name === activeName)))

  function navigate(event: KeyboardEvent, index: number) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? names.length - 1
      : event.key === 'ArrowRight' ? (index + 1) % names.length
        : event.key === 'ArrowLeft' ? (index - 1 + names.length) % names.length : undefined
    if (next === undefined) return
    event.preventDefault()
    activeName = names[next]
    buttons[next]?.focus()
  }
</script>

{#if names.length}
  <div class="segment-views">
    <div class="ui-segmented" role="tablist" aria-label={label}>
      {#each names as name, index (name)}<button
        bind:this={buttons[index]}
        type="button"
        id={`${prefix}-tab-${index}`}
        role="tab"
        aria-controls={`${prefix}-panel-${index}`}
        aria-selected={activeIndex === index}
        tabindex={activeIndex === index ? 0 : -1}
        onclick={() => { activeName = name }}
        onkeydown={event => navigate(event, index)}>
        {name}
      </button>{/each}
    </div>
    {#each names as name, index (name)}
      <div class="segment-panel"
        id={`${prefix}-panel-${index}`}
        role="tabpanel"
        aria-labelledby={`${prefix}-tab-${index}`}
        tabindex="0"
        hidden={activeIndex !== index}>
        <div class="segment-panel-label">{name}</div>
        {@render (segments[name] as Snippet | undefined)?.()}
      </div>
    {/each}
  </div>
{/if}
