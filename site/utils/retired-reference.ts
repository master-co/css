/** Retired teaching pages are navigation entrances only, never indexed documents. */
export const retiredReferencePages = {
  "animation": "animate",
  "background": "background-color",
  "border": "border-width",
  "border-image": "border-image-source",
  "columns": "column-count",
  "flex": "flex-grow",
  "grid": "grid-template-columns",
  "grid-template": "grid-template-columns",
  "list-style": "list-style-type",
  "outline": "outline-width",
  "text-decoration": "text-decoration-line",
  "text-stroke": "text-stroke-width",
  "transition": "transition-property",
  "white-space": "white-space-collapse",
  "text-wrap": "text-wrap-mode",
  "line-clamp": "clamp-lines"
} as const

export type RetiredReferenceSlug = keyof typeof retiredReferencePages
export function retiredReferenceDestination(slug: RetiredReferenceSlug, locale: string) {
  return `${locale === 'en' || locale === 'tw' ? `/${locale}` : ''}/reference/${retiredReferencePages[slug]}`
}
