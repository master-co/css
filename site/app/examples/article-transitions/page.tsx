import ArticleTransitionScene from '~/site/app/[locale]/guide/view-transitions/components/ArticleTransitionScene'

export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
  return <ArticleTransitionScene />
}
