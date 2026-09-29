import RootClient from './root'
import { createTranslation, importTranslations } from '~/site/docs-shell/utils/i18n'
import dictionaries from '../dictionaries'
import HTML from '~/site/docs-shell/layouts/html'
import Body from '~/site/docs-shell/layouts/body'
import DocHeader from '~/site/docs-shell/components/DocHeader'
import SearchButton from '~/site/docs-shell/components/SearchButton'

export default async function NotFound() {
  const translations = await importTranslations('en', dictionaries)
  const $ = await createTranslation('en', dictionaries)
  return (
    <HTML locale="en" hidden>
      <RootClient locale="en" translations={translations} hidden>
        <Body className="bg-surface-base">
          <DocHeader />
          <div className="display:flex flex-direction:column align-items:center justify-content:center min-height:100dvh padding-inline:2.5rem padding-top:3.125rem padding-top:3.75rem@md">
            <h3 className="mt-2xl margin-bottom:1.25rem font-lg letter-spacing:.01em text-align:center fg-accent">404</h3>
            <h1 className="margin-top:0 font-3xl leading-xs text-align:center fg-text-strong font-5xl@sm">{$('This page does not exist')}</h1>
            <div className="mb-2xl padding:var(--spacing-md)|var(--spacing-xs)">
              <p className="text-lg fg-text-muted">{$('Sorry, the page cannot be found. Please try searching for other content.')}</p>
              <SearchButton className="display:flex align-items:center min-width:15rem margin-inline:auto margin-top:2.5rem px-lg border-radius:1e9em border:1px|solid|var(--color-line-control) line-height:3rem fg-text-muted pointer-events:auto" />
            </div>
          </div>
        </Body>
      </RootClient>
    </HTML>
  )
}
