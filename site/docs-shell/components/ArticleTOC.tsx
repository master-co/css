import { useI18n, useTranslation } from '../contexts/i18n'
import { useLocale } from '../contexts/locale'
import PageContentDisclosure from './PageContentDisclosure'

/**
 * A page's contents placed in its text: the same disclosure, drawn as the same ruler, that documentation pages show
 * under their header on narrow screens. Its label is in the reader's language, even inside text still in its source
 * language.
 */
export default function ArticleTOC({ data }: { data: { id: string, title: string, level: number }[] }) {
  const $ = useTranslation()
  const { hreflangOfLocale } = useI18n()
  const locale = useLocale()
  const items = (data ?? []).filter((item): item is { id: string, title: string, level: 2 | 3 } => item.level === 2 || item.level === 3)
  if (!items.some((item) => item.level === 2)) return null
  return <PageContentDisclosure items={items} label={$('On this page')} labelLang={hreflangOfLocale?.[locale] ?? locale} />
}
