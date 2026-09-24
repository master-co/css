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
          <div className="flex flex-col items-center justify-center min-h:100dvh px:2.5rem pt:3.125rem pt:3.75rem@md">
            <h3 className="mb:1.25rem mt-2xl font-lg tracking:.01em text-center fg-accent">404</h3>
            <h1 className="mt:0 font-3xl leading-xs text-center text-strong font-5xl@sm">{$('This page does not exist')}</h1>
            <div className="mb-2xl p:var(--spacing-md)|var(--spacing-xs)">
              <p className="text-lg text-muted">{$('Sorry, the page cannot be found. Please try searching for other content.')}</p>
              <SearchButton className="flex items-center min-w:15rem mx:auto mt:2.5rem px-lg rounded b:1px|solid|var(--color-line-muted) leading:3rem text-disabled pointer-events:auto" />
            </div>
          </div>
        </Body>
      </RootClient>
    </HTML>
  )
}
