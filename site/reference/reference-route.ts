import { routeIndex } from './route-index'
import { loadReferenceDocument } from './load-document'
import type { ReferenceDocument } from './types'

export function referenceMetadata(id: string, locale: string) {
  const doc = routeIndex.find(doc => doc.id === id)
  if (!doc) return {}
  return { title: doc.title, description: doc.description, alternates: { canonical: `${locale === 'tw' ? '/tw' : ''}${doc.url}` } }
}

export async function loadReferenceRoute(id: string, kind?: ReferenceDocument['kind']) {
  if (!routeIndex.some(doc => doc.id === id && (!kind || doc.kind === kind))) throw new Error(`Unknown reference route ${id}`)
  return loadReferenceDocument(id)
}
