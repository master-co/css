import i18n from '../docs-shell/common/i18n.config.js'
import { generateSearchPages } from '../docs-shell/utils/search-pages'

await generateSearchPages({
  defaultLocale: i18n.defaultLocale,
  locales: i18n.locales
})
