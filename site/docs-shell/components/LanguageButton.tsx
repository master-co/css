import { IconLanguage } from '@tabler/icons-react'
import LanguageSelect from './LanguageSelect'
import clsx from 'clsx'
import { useTranslation } from '../contexts/i18n'

export default function LanguageButton({ className }: { className?: string }) {
  const $ = useTranslation()
  return (
    <div className={clsx('position:relative doc-preference-control', className)}>
      <span aria-hidden="true">
        <IconLanguage width="22" height="22" strokeWidth="1.2" />
      </span>
      <LanguageSelect aria-label={$('Language switch')} />
    </div>
  )
}
