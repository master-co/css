import { IconLanguage } from '@tabler/icons-react'
import LanguageSelect from './LanguageSelect'
import clsx from 'clsx'
import { useTranslation } from '../contexts/i18n'

/** An icon button that opens the native language list laid over it. */
export default function LanguageButton({ className }: { className?: string }) {
  const $ = useTranslation()
  return (
    <label className={clsx('ui-button', className)} data-variant="quiet" data-shape="icon" data-size="sm">
      <IconLanguage width="18" height="18" strokeWidth="1.5" aria-hidden="true" />
      <LanguageSelect aria-label={$('Language switch')} />
      <span className="ui-tooltip" data-side="bottom" aria-hidden="true">{$('Language')}</span>
    </label>
  )
}
