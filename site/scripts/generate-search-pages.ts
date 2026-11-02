import i18n from '@master/internal-site/common/i18n.config.js'
import { generateSearchPages } from '@master/internal-site/utils/search-pages'

await generateSearchPages({
  defaultLocale: i18n.defaultLocale,
  locales: i18n.locales
})
