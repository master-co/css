import { routeIndexForLocale } from './route-index'
import { loadReferenceDocument } from './load-document'
import type { ReferenceDocument } from './types'

const pathname = (url: string, locale: string) => locale === 'en' ? url : `/${locale}${url}`
export function referenceMetadata(id: string, locale: string) {
  const doc = routeIndexForLocale(locale).find(doc => doc.id === id)
  if (!doc) throw new Error(`Unknown Reference route: ${id} (${locale})`)
  return { title: doc.title, description: doc.description, alternates: { canonical: pathname(doc.url, locale) } }
}

export async function loadReferenceRoute(id: string, locale = 'en', kind?: ReferenceDocument['kind']) {
  if (!routeIndexForLocale(locale).some(doc => doc.id === id && (!kind || doc.kind === kind))) throw new Error(`Unknown Reference route: ${id} (${locale})`)
  return loadReferenceDocument(id, locale)
}
