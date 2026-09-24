import { IconLanguage } from '@tabler/icons-react'
import LanguageSelect from './LanguageSelect'
import clsx from 'clsx'
import { useTranslation } from '../contexts/i18n'

export default function LanguageButton({ className }: { className?: string }) {
  const $ = useTranslation()
  return (
    <div className={clsx('rel', className)}>
      <button aria-label={$('Language switch')}>
        <IconLanguage width="22" height="22" strokeWidth="1.2" />
      </button>
      <LanguageSelect />
    </div>
  )
}
