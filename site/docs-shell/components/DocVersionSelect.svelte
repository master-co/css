<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements'
  import clsx from 'clsx'
  import app from '~/site/app-config'

  type Props = Omit<HTMLSelectAttributes, 'value' | 'onchange'>

  /** A native select; by default invisible over its positioned label (`ui-select[data-variant="overlay"]`), which shows the value. */
  let { class: className, ...props }: Props = $props()
  const currentURL = import.meta.env.PUBLIC_URL

  function navigate(event: Event & { currentTarget: HTMLSelectElement }) {
    window.location.href = event.currentTarget.value
  }
</script>

<select name="version" value={currentURL}
  data-variant="overlay" {...props} class={clsx('ui-select', className)}
  onchange={navigate}>
  <option value={currentURL}>v{import.meta.env.PUBLIC_VERSION}</option>
  {#each app.versions as { name, href } (href)}<option value={href}>{name}</option>{/each}
</select>
