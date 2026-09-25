// Context dependencies include the project root so additions/renames are seen.
// Publishing bookkeeping must not invalidate those same module dependencies.
// Keep next.css, immutable assets and the configuration state file observable.
const bookkeeping = /[/\\]\.master[/\\](?:publish\.lock(?:\.recovery)?|next-static-(?:publication|inputs)\.json|next-static-scanned-sources\.log|[^/\\]*\.tmp-[^/\\]*)$/
const globs = [
  '**/.master/publish.lock', '**/.master/publish.lock.recovery',
  '**/.master/next-static-publication.json', '**/.master/next-static-inputs.json',
  '**/.master/next-static-scanned-sources.log', '**/.master/*.tmp-*'
]

export function staticWatchIgnores(ignored?: RegExp | string | readonly string[]): RegExp | string[] {
  if (ignored instanceof RegExp) return new RegExp(`(?:${ignored.source})|(?:${bookkeeping.source})`, ignored.flags)
  return [...(typeof ignored === 'string' ? [ignored] : ignored ?? []), ...globs]
}
