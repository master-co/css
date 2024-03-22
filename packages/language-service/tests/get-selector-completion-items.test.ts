import getSelectorCompletionItems from '../src/utils/get-pseudo-element-completion-items'

test('selector completion items', () => {
    expect(getSelectorCompletionItems()).toEqual([])
})