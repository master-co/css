import { useTranslation } from '../contexts/i18n'
import SearchButton from './SearchButton'

export default function NotFound() {
  const $ = useTranslation()
  return (
    <div className="display:flex flex-direction:column align-items:center justify-content:center min-height:100dvh padding-inline:2.5rem padding-top:3.125rem padding-top:3.75rem@md">
      <h3 className="mt-2xl margin-bottom:1.25rem font-lg letter-spacing:.01em text-align:center fg-accent">404</h3>
      <h1 className="margin-top:0 font-3xl leading-xs text-align:center fg-text-strong font-5xl@sm">{$('This page does not exist')}</h1>
      <div className="mb-2xl padding-bottom:var(--spacing-md) padding-left:var(--spacing-xs) padding-right:var(--spacing-xs) padding-top:var(--spacing-md)">
        <p className="text-lg fg-text-muted">{$('Sorry, the page cannot be found. Please try searching for other content.')}</p>
        <SearchButton className="display:flex align-items:center min-width:15rem margin-inline:auto margin-top:2.5rem px-lg b-line-control border-radius:1e9em border-style:solid border-width:1px line-height:3rem fg-text-muted pointer-events:auto" />
      </div>
    </div>
  )
}
