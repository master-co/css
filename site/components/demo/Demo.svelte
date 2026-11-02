<script module lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import type { DemoStyle } from './style'

  export type DemoBackground = 'plain' | 'grid' | 'dots' | 'hatch' | 'checkerboard'
  export type DemoPadding = 'none' | 'sm' | 'lg'
  export type DemoFrame = 'default' | 'none'
  export type DemoAlign = 'center' | 'start'
  /** Markup props take text, or a snippet (a named slot from `.astro` and `.mdx`). */
  export type DemoNode = string | Snippet

  export interface DemoProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'style' | 'children'> {
    title?: string
    description?: DemoNode
    caption?: DemoNode
    background?: DemoBackground
    padding?: DemoPadding
    /** `none` omits the stage when the content already owns its frame: a browser, a comparison, a code window. */
    frame?: DemoFrame
    /** Placement on the stage: centered specimens by default, or from the start edge. */
    align?: DemoAlign
    controls?: DemoNode
    /** Source and generated output, placed under the stage inside the same tray. */
    source?: DemoNode
    frameClassName?: string
    style?: DemoStyle
    children?: Snippet
  }
</script>

<script lang="ts">
  import '~/site/styles/demo.css'
  import { styleText } from './style'

  /** One example is one tray: head, stage, source, caption. class and style belong to the stage; the chrome never joins the demonstrated layout. */
  let {
    title, description, caption, background = 'plain', padding = 'lg', frame = 'default', align = 'center', controls, source,
    frameClassName, class: className, style, children, ...props
  }: DemoProps = $props()
  const head = $derived(Boolean(title || description || controls))
</script>

{#snippet node(value: DemoNode)}{#if typeof value === 'function'}{@render value()}{:else}{value}{/if}{/snippet}

<figure {...props} class={['ui-tray', frameClassName]}>{#if head}<figcaption class="ui-tray-head">
    {#if title || description}<div>
      {#if title}<p class="ui-tray-title">{title}</p>{/if}
      {#if description}<p class="ui-tray-description">{@render node(description)}</p>{/if}
    </div>{/if}
    {#if controls}<div class="ui-tray-tools">{@render node(controls)}</div>{/if}
  </figcaption>{/if}{#if frame === 'none'}{@render children?.()}{:else}<div class={['ui-stage', className]} style={styleText(style)}
    data-background={background === 'plain' ? undefined : background}
    data-padding={padding === 'lg' ? undefined : padding}
    data-align={align === 'center' ? undefined : align}>{@render children?.()}</div>{/if}{#if source}{@render node(source)}{/if}{#if caption}{#if head}<div class="ui-tray-caption">{@render node(caption)}</div>{:else}<figcaption class="ui-tray-caption">{@render node(caption)}</figcaption>{/if}{/if}</figure>
