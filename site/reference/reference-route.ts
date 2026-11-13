import { createPageMetadata } from '@master/internal-site/factories/create-page'
import dictionaries from '../dictionaries'
import { referenceText } from './copy'
import { routeIndexForLocale } from './route-index'
import { loadReferenceDocument } from './load-document'
import type { ReferenceDocument } from './types'

export function referenceMetadata(id: string, locale: string) {
  const doc = routeIndexForLocale(locale).find(doc => doc.id === id)
  if (!doc) throw new Error(`Unknown Reference route: ${id} (${locale})`)
  const section = referenceText('overview', 'title', locale)
  return createPageMetadata({
    title: `${doc.title} | ${section}`,
    description: doc.description,
    category: doc.category,
  }, dictionaries)({ params: { locale } })
}

export async function loadReferenceRoute(id: string, locale = 'en', kind?: ReferenceDocument['kind']) {
  if (!routeIndexForLocale(locale).some(doc => doc.id === id && (!kind || doc.kind === kind))) throw new Error(`Unknown Reference route: ${id} (${locale})`)
  return loadReferenceDocument(id, locale)
}
