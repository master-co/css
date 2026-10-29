import { routeIndex } from '~/site/reference/route-index'

export function generateStaticParams() {
  return routeIndex.filter(doc => doc.kind === 'utility').map(doc => ({ entry: doc.id }))
}
