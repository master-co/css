export interface SourceAdapterInput {
    source: string
    content: string
}

export interface SourceAdapter {
    name: string
    test: RegExp | ((source: string) => boolean)
    extract(input: SourceAdapterInput): string[]
}

export function matchesSourceAdapter(adapter: SourceAdapter, source: string) {
    return typeof adapter.test === 'function'
        ? adapter.test(source)
        : adapter.test.test(source)
}
