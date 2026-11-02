<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLSelectAttributes } from 'svelte/elements'
  import clsx from 'clsx'
  import { getSite } from '../site'
  import { localizePathname } from '../utils/i18n-pathname'

  interface Props extends Omit<HTMLSelectAttributes, 'value' | 'onchange'> {
    children?: Snippet
  }

  /** A native select; by default invisible over its positioned label (`ui-select[data-variant="overlay"]`), which shows the value. */
  let { class: className, children, ...props }: Props = $props()
  const { pathname, locale, i18n } = getSite()

  function onchange(event: Event & { currentTarget: HTMLSelectElement }) {
    const newLocale = event.currentTarget.value
    const splits = pathname.split('/')
    for (const eachLocale of i18n.locales) {
      if (splits[1] === eachLocale) {
        splits.splice(1, 1)
        break
      }
    }
    const target = localizePathname(splits.join('/') || '/', {
      defaultLocale: i18n.defaultLocale,
      locale: newLocale,
      locales: i18n.locales as string[],
      localizablePathnameRoots: i18n.localizablePathnameRoots
    })
    location.assign(target + location.search + location.hash)
  }
</script>

<select data-variant="overlay" {...props} class={clsx('ui-select', className)}
  {onchange}
  value={locale}>
  {#each Object.entries(i18n.nameOfLocale) as [eachLocale, localeName] (eachLocale)}
    <option value={eachLocale}>
      {localeName}
    </option>
  {/each}
</select>
{@render children?.()}
