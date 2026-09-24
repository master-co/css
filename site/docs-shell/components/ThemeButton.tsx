import clsx from 'clsx'
import ThemeIcon from './ThemeIcon'
import ThemeSelect from './ThemeSelect'
import { useTranslation } from '../contexts/i18n'

export default function ThemeButton({ className }: any) {
  const $ = useTranslation()
  return (
    <div className={clsx(className, 'rel')}>
      <button className="" aria-label={$('Theme switch')}>
        <ThemeIcon width="22" height="22" strokeWidth="1.2" />
      </button>
      <ThemeSelect />
    </div>
  )
}
