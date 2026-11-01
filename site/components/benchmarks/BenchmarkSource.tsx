import '~/site/styles/system/data.css'
import Translate from '~/site/docs-shell/components/Translate'

/** The evidence and its date stay beside the claim. */
export default function BenchmarkSource({ generatedAt, href, label = 'Committed snapshot' }: {
  generatedAt: string
  href: string
  label?: string
}) {
  return (
    <p className="ui-source">
      <Translate>Evidence</Translate>
      <a href={href}><Translate>{label}</Translate></a>
      <span><Translate>Recorded</Translate> <time dateTime={generatedAt}>{generatedAt.slice(0, 10)} UTC</time></span>
    </p>
  )
}
