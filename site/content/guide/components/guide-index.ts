import type { GuideCategory } from '~/site/utils/guide-overview'

/**
 * Only what `GuideIndex` renders: hydrated props are inlined into the page.
 * Keeps top-level guide pages (`/guide/<page>`), the only ones `guideOverviewSections` lists.
 */
export function guideIndexCategories(categories: GuideCategory[]): GuideCategory[] {
  return categories.map(category => ({
    name: category.name,
    pages: category.pages
      .filter(page => page.pathname.split('/').length === 3)
      .map(({ title, pathname, description, disabled, unfinished }) => ({ title, pathname, description, disabled, unfinished }))
  }))
}
