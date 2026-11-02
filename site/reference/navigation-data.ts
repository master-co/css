import { referenceSections, type ReferenceDocument } from './types'

type Entry = Pick<ReferenceDocument, 'kind' | 'title' | 'category' | 'url'>

/** The portable index follows the same section vocabulary and catalog as the UI. */
export function referenceOverviewMarkdown(documents: (Entry & { description: string })[]) {
  return referenceSections.map(section => [
    `<a id="${section.id}"></a>`, '', `## ${section.title}`, '', section.description, '',
    ...documents.filter(doc => section.kinds.includes(doc.kind))
      .map(doc => `- [${doc.title}](${doc.url}): ${doc.description}`)
  ].join('\n')).join('\n\n') + '\n\n[Start with the Guide](/guide) to learn concepts and build with step-by-step examples.\n'
}

/** Both the existing sidebar and the mobile menu use the same selected catalog. */
export function referenceNavigationCategories(documents: Entry[], categoryOrder: string[]) {
  return referenceSections.flatMap(section => {
    const docs = documents.filter(document => section.kinds.includes(document.kind))
    return [...new Set(docs.map(document => document.category))]
      .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
      .map(name => ({ name, pages: docs.filter(document => document.category === name).map(document => ({ title: document.title, pathname: document.url })) }))
  })
}
