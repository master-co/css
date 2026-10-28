import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import Content from './content.mdx'
import '~/site/styles/docs-shell/prose.css'

export { metadata }

export default function Page() {
  return <main className="ds-component-page">
    <ReviewNavigation />
    <h1>Prompts and workflows</h1>
    <div className="ds-component-document prose"><Content /></div>
  </main>
}
