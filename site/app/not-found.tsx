import RootClient from './root'
import { createTranslation, importTranslations } from '~/internal/utils/i18n'
import dictionaries from '../dictionaries'
import HTML from 'internal/layouts/html'
import Body from 'internal/layouts/body'
import DocHeader from 'internal/components/DocHeader'
import SearchButton from 'internal/components/SearchButton'

export default async function NotFound() {
  const translations = await importTranslations('en', dictionaries)
  const $ = await createTranslation('en', dictionaries)
  return (
    <HTML locale="en" hidden>
      <RootClient locale="en" translations={translations} hidden>
        <Body className="bg:surface-base">
          <DocHeader />
          <div className="flex flex-col items-center justify-center min-h:100dvh px:10x pt:3.125rem pt:15x@md">
            <h3 className="mb:5x mt:2xl font:lg tracking:.01em text-center fg:accent">404</h3>
            <h1 className="mt:0 font:3xl leading:xs text-center text:strong font:5xl@sm">{$('This page does not exist')}</h1>
            <div className="mb:2xl p:md|xs">
              <p className="text:lg text:muted">{$('Sorry, the page cannot be found. Please try searching for other content.')}</p>
              <SearchButton className="flex items-center min-w:60x mx:auto mt:10x px:lg rounded b:1px|solid|muted leading:3rem text:disabled pointer-events:auto" />
            </div>
          </div>
        </Body>
      </RootClient>
    </HTML>
  )
}
