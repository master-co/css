import { routeIndex } from '~/site/reference/route-index'

export function generateStaticParams() {
  return routeIndex.filter(doc => doc.kind === 'tokens').map(doc => ({ namespace: doc.id.slice('tokens/'.length) }))
}
