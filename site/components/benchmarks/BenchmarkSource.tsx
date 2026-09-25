import '~/site/styles/benchmarks.css'
import Translate from '~/site/docs-shell/components/Translate'

export default function BenchmarkSource({ generatedAt, href, label = 'Committed snapshot' }: {
  generatedAt: string
  href: string
  label?: string
}) {
  return (
    <p className="benchmark-source">
      <span className="benchmark-source-kicker"><Translate>Evidence</Translate></span>
      <a href={href}><Translate>{label}</Translate></a>
      <span className="benchmark-source-date"><Translate>Recorded</Translate> <time dateTime={generatedAt}>{generatedAt.slice(0, 10)} UTC</time></span>
    </p>
  )
}
