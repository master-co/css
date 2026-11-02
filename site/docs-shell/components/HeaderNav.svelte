<script lang="ts">
  import type { Snippet } from 'svelte'
  import Link from './Link.svelte'

  interface Props {
    name?: string
    isNew?: boolean
    children?: Snippet
    [key: string]: any
  }

  /** A primary section link; it is current anywhere inside its section. */
  let { name: _name, children, isNew: _isNew, ...props }: Props = $props()
</script>

<Link {...props} current="true" ambiguous>
  {@render children?.()}
</Link>
