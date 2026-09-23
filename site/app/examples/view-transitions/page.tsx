import ViewTransitionScene from '~/site/app/[locale]/guide/view-transitions/components/ViewTransitionScene'

export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
  return <ViewTransitionScene />
}
