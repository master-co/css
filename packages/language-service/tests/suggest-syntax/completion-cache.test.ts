import { expect, test } from 'vitest'
import { Position } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../../src/core'
import createDoc from '../../src/utils/create-doc'

function suggest(languageService: CSSLanguageService, target: string) {
    const contents = [`<div class="`, target, `"></div>`]
    const doc = createDoc('html', contents.join(''))
    return languageService.suggestSyntax(doc, { line: 0, character: contents[0].length + target.length } as Position, {
        triggerKind: 2,
        triggerCharacter: target.charAt(target.length - 1)
    })
}

test.concurrent('returns fresh class completion items from cached skeletons', () => {
    const languageService = new CSSLanguageService()
    const firstCompletionItems = suggest(languageService, '')
    const firstBlockCompletionItem = firstCompletionItems?.find(({ label }) => label === 'block')
    if (!firstBlockCompletionItem) throw new Error('Expected block completion item')

    firstBlockCompletionItem.detail = 'mutated'

    const secondCompletionItems = suggest(languageService, '')
    expect(secondCompletionItems?.find(({ label }) => label === 'block')?.detail).not.toBe('mutated')
})

test.concurrent('does not leak selector insertText mutations between requests', () => {
    const languageService = new CSSLanguageService()
    expect(suggest(languageService, 'text-center:')?.find(({ label }) => label === '::after')).toMatchObject({ insertText: ':after' })
    expect(suggest(languageService, 'text-center::')?.find(({ label }) => label === '::after')).toMatchObject({ insertText: 'after' })
    expect(suggest(languageService, 'text-center:')?.find(({ label }) => label === '::after')).toMatchObject({ insertText: ':after' })
})
