import { useTranslation } from '../contexts/i18n'
import SearchButton from './SearchButton'
import Link from './Link'
import { useLocale } from '../contexts/locale'
import '~/site/styles/docs-shell/not-found.css'

export default function NotFound() {
  const $ = useTranslation()
  const tw = useLocale() === 'tw'
  return (
    <main className="flex flex-col items-center justify-center (min-height:100dvh) (padding-inline:2.5rem) (padding-top:3.125rem) (padding-top:3.75rem)@md not-found">
      <p className="mt-2xl (margin-bottom:1.25rem) font-lg (letter-spacing:.01em) text-center fg-accent">404</p>
      <h1 className="mt(0) font-3xl leading-xs text-center fg-text-strong font-5xl@sm">{$('This page does not exist')}</h1>
      <div className="mb-2xl (padding-bottom:var(--spacing-md)) (padding-left:var(--spacing-xs)) (padding-right:var(--spacing-xs)) (padding-top:var(--spacing-md))">
        <p className="text-lg fg-text-muted">{tw ? '試著搜尋文件，或返回 Guide 繼續閱讀。' : 'Try searching the documentation or return to the Guide.'}</p>
        <SearchButton className="not-found-search" />
        <Link href="/guide" className="not-found-guide">{tw ? '瀏覽 Guide' : 'Browse the Guide'}<span aria-hidden="true">→</span></Link>
      </div>
    </main>
  )
}
