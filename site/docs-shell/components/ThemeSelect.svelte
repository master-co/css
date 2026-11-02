<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements'
  import clsx from 'clsx'
  import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode.svelte'
  import { getSite } from '../site'

  type Props = Omit<HTMLSelectAttributes, 'value' | 'onchange'>

  /** A native select; by default invisible over its positioned label (`ui-select[data-variant="overlay"]`), which shows the value. */
  let { class: className, ...props }: Props = $props()
  const themeMode = useThemeMode()
  const { t } = getSite()
</script>

<select data-variant="overlay" {...props} class={clsx('ui-select', className)} value={themeMode.preference}
  onchange={(event) => { themeMode.preference = event.currentTarget.value }}>
  <option value="light">{t('Light')}</option>
  <option value="dark">{t('Dark')}</option>
  <option value="system">{t('System')}</option>
</select>
