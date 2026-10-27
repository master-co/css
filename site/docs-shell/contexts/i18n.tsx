import { useCallback, useContext } from 'react'
import { sharedContext } from '~/site/islands/context'

export declare interface i18nConfig {
  translations: any,
  defaultLocale: string,
  locales: string[],
  localizablePathnameRoots?: string[],
  hreflangOfLocale: any,
  nameOfLocale: any
}

const I18nContext = sharedContext<i18nConfig | null>('i18n', null)

export const I18nProvider = (props: any) => {
  return <I18nContext.Provider {...props} />
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (context === null) {
    throw new Error(`useI18n must be used within a I18nProvider`)
  }
  return context
}

export const useTranslation = () => {
  const { translations } = useI18n()
  const translate = useCallback((text: any) => translations[text || ''] || text, [translations])
  return translate
}

export default I18nContext
