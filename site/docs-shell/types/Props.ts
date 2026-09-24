import i18n from '../common/i18n.config.js'

export interface Props {
  params: Promise<{
    locale: typeof i18n.locales[number],
    [key: string]: any
  }>,
  searchParams?: Promise<any>
  children: any
}