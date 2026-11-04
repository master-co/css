<script lang="ts" module>
  import clsx from 'clsx'
  import logotypeAtDark from '@master/internal-site/assets/brand/v2/logo/master-css/master-css-horizontal-on-dark.svg?raw'
  import logotypeAtLight from '@master/internal-site/assets/brand/v2/logo/master-css/master-css-horizontal-on-light.svg?raw'

  const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
</script>

<script lang="ts">
  import type { SVGAttributes } from 'svelte/elements'

  type Props = SVGAttributes<SVGSVGElement>

  /** The Master CSS logotype in both modes; the page's mode shows one. Attributes apply to the `<svg>` of each. */
  let { class: className, ...props }: Props = $props()
  const instanceId = $props.id()

  /** Attributes added at the start of the artwork's `<svg>` tag win over its own. */
  function render(source: string, modeClass: string) {
    const attributes = Object.entries({ ...props, class: clsx(className, modeClass) })
      .filter(([, value]) => value != null && value !== false)
      .map(([name, value]) => ` ${name}="${escapeAttribute(String(value))}"`)
      .join('')
    return source
      .replace(/(\sid="|url\(#|href="#)/g, `$1${instanceId}-`)
      .replace(/<svg\b/, `<svg${attributes}`)
  }
</script>

<!-- File prefixes separate the modes; the instance prefix separates header and footer artwork. -->
{@html render(logotypeAtDark, 'hidden@apply(--site-light)')}
{@html render(logotypeAtLight, 'hidden@apply(--site-dark)')}
