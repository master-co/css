import { referenceSections, type ReferenceDocument } from './types'

type Entry = Pick<ReferenceDocument, 'kind' | 'title' | 'category' | 'url'>

/** Both the existing sidebar and the mobile menu use the same selected catalog. */
export function referenceNavigationCategories(documents: Entry[], categoryOrder: string[]) {
  return referenceSections.flatMap(section => {
    const docs = documents.filter(document => section.kinds.includes(document.kind))
    return [...new Set(docs.map(document => document.category))]
      .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
      .map(name => ({ name, pages: docs.filter(document => document.category === name).map(document => ({ title: document.title, pathname: document.url })) }))
  })
}
