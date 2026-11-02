<script lang="ts">
  import IconLanguage from '@tabler/icons-svelte-runes/icons/language'
  import LanguageSelect from './LanguageSelect.svelte'
  import clsx from 'clsx'
  import { getSite } from '../site'

  /** An icon button that opens the native language list laid over it. */
  let { class: className }: { class?: string } = $props()
  const { t } = getSite()
</script>

<label class={clsx('ui-button', className)} data-variant="quiet" data-shape="icon" data-size="sm">
  <IconLanguage size={18} stroke={1.5} aria-hidden="true" />
  <LanguageSelect aria-label={t('Language switch')} />
  <span class="ui-tooltip" data-side="bottom" aria-hidden="true">{t('Language')}</span>
</label>
