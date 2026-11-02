<script lang="ts">
  import '~/site/styles/system/specimens.css'
  import type { ComponentProps } from 'svelte'
  import type { SVGAttributes } from 'svelte/elements'
  import Image from '~/site/docs-shell/components/Image.svelte'
  import { styleText, type DemoStyle } from './style'
  import type { DemoTone } from './tone'

  type ImageProps = Omit<ComponentProps<typeof Image>, 'src' | 'alt'> & { src: string, alt: string, tone?: never, style?: string }
  type VectorProps = Omit<SVGAttributes<SVGSVGElement>, 'style'> & { src?: never, alt?: never, tone?: DemoTone, style?: DemoStyle }

  /** Original artwork in a teaching tone, or a real image with its intrinsic size. */
  let { src, alt, tone: value = 'neutral', style, ...props }: ImageProps | VectorProps = $props()
</script>

{#if src !== undefined}
  <Image width={320} height={200} {...props as Omit<ImageProps, 'src' | 'alt'>} {style} {src} alt={alt!} />
{:else}
  <svg viewBox="0 0 320 200" role="img" aria-label="Sun above two mountain ridges" {...props as SVGAttributes<SVGSVGElement>}
    style={[`color:var(--ui-tone-${value})`, styleText(style)].filter(Boolean).join(';')}>
    <rect width="320" height="200" fill="var(--ui-surface-sheet)" />
    <path d="M0 175V158l92-93 113 110H0Z" fill="currentColor" opacity=".1" />
    <path d="M74 200 211 83l109 102v15H74Z" fill="currentColor" opacity=".16" />
    <circle cx="250" cy="49" r="23" fill="currentColor" opacity=".11" />
    <circle cx="250" cy="49" r="22.5" fill="none" stroke="currentColor" stroke-opacity=".5" />
    <path d="M0 158 92 65l113 110M74 200 211 83l109 102M0 175h103" fill="none" stroke="currentColor" stroke-opacity=".38" />
    <path d="M23 183h62m130-6h72" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width=".75" />
    <circle cx="92" cy="65" r="2.5" fill="currentColor" />
    <circle cx="211" cy="83" r="2.5" fill="currentColor" />
    <rect width="319" height="199" x=".5" y=".5" fill="none" stroke="var(--ui-line-contour)" />
  </svg>
{/if}
