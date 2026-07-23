export interface SourceAdapterInput {
  source: string
  content: string
}

export interface SourceAdapter {
  name: string
  test: RegExp | ((source: string) => boolean)
  extract(input: SourceAdapterInput): Promise<string[]>
}

export function matchesSourceAdapter(adapter: SourceAdapter, source: string) {
  if (typeof adapter.test === 'function') return adapter.test(source)
  adapter.test.lastIndex = 0
  const matched = adapter.test.test(source)
  adapter.test.lastIndex = 0
  return matched
}
