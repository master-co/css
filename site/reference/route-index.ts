import routeIndexJSON from '../.generated/reference-route-index.json'
import type { ReferenceDocument } from './types'

export type ReferenceRouteEntry = Pick<ReferenceDocument, 'id' | 'kind' | 'title' | 'description' | 'category' | 'url'>

export const routeIndex = routeIndexJSON as ReferenceRouteEntry[]
