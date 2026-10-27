import i18n from '../common/i18n.config.js'

export interface PageParams {
  locale: typeof i18n.locales[number]
  [key: string]: any
}

export interface Props {
  params: PageParams
  children?: any
}
