import { useTranslation } from '../contexts/i18n'
import SearchButton from './SearchButton'
import Link from './Link'
import { useLocale } from '../contexts/locale'
import '~/site/styles/docs-shell/not-found.css'

export default function NotFound() {
  const $ = useTranslation()
  const tw = useLocale() === 'tw'
  return (
    <main className="ui-not-found">
      <div className="ui-pagehead">
        <span className="ui-pagehead-kicker">404</span>
        <h1>{$('This page does not exist')}</h1>
        <p>{tw ? '試著搜尋文件，或返回 Guide 繼續閱讀。' : 'Try searching the documentation or return to the Guide.'}</p>
      </div>
      <SearchButton className="ui-search-trigger" />
      <Link href="/guide" className="ui-button" data-variant="quiet">{tw ? '瀏覽 Guide' : 'Browse the Guide'}<span aria-hidden="true">→</span></Link>
    </main>
  )
}
