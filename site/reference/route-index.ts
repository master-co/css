import indexesJSON from '../.generated/reference-route-indexes.json'
import type { ReferenceDocument } from './types'

export type ReferenceRouteEntry = Pick<ReferenceDocument, 'id' | 'kind' | 'title' | 'description' | 'category' | 'url'>
const indexes = indexesJSON as Record<string, ReferenceRouteEntry[]>

/** Lightweight enumeration imports neither article payloads nor specimen catalogs. */
export const routeIndex = indexes.en
export function routeIndexForLocale(locale = 'en') {
  const entries = indexes[locale]
  if (!entries) throw new Error(`Reference edition is not prepared: ${locale}`)
  return entries
}
