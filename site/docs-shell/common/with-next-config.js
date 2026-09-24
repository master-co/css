import i18n from './i18n.config.js'
import { defu } from 'defu'
import defaultConfig from './next.config.js'
import commonRedirects from './redirects.js'
import commonRewrites from './rewrites.js'

export default async function withCommonNextConfig({ redirects = [], rewrites = [], ...customConfig }) {
  return defu({
    redirects: () => [...commonRedirects, ...redirects]
      .map((eachRedirect) => {
        return i18n.locales
          .filter((locale) => locale !== 'en')
          .map((locale) => {
            return {
              ...eachRedirect,
              source: `/${locale}${eachRedirect.source}`,
              destination: `/${locale}${eachRedirect.destination}`,
            }
          })
          .flat()
      })
      .flat(),
    rewrites: () => [...commonRewrites, ...rewrites]
  }, customConfig, defaultConfig)
}
