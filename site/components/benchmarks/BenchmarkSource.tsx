export default function BenchmarkSource({ generatedAt, href, label = 'Committed snapshot' }: {
  generatedAt: string
  href: string
  label?: string
}) {
  return (
    <p className="benchmark-source">
      <span>Recorded <time dateTime={generatedAt}>{generatedAt.slice(0, 10)} UTC</time></span>
      <a href={href}>{label}</a>
    </p>
  )
}
