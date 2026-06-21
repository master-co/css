import { expect, test } from 'vitest'
import { Position } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../../src/core'
import createDoc from '../../src/utils/create-doc'
import { generateCSS } from '@master/css-language'

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

function getMapEntries(map: Map<string, number>) {
    return Array.from(map.entries())
}

function snapshotLanguageCSS(languageService: CSSLanguageService) {
    const { css } = languageService
    return {
        text: css.text,
        classUtilities: Array.from(css.classUtilities.keys()),
        themeRules: css.themeLayer.rules.map((rule) => rule.key),
        themeTokenCounts: getMapEntries(css.themeLayer.tokenCounts),
        utilityRules: css.utilitiesLayer.rules.map((rule) => rule.key),
        animationRules: css.animationsNonLayer.rules.map((rule) => rule.key),
        animationTokenCounts: getMapEntries(css.animationsNonLayer.tokenCounts)
    }
}

test.concurrent('documentation CSS generation does not mutate language service state', () => {
    const languageService = new CSSLanguageService()
    const before = snapshotLanguageCSS(languageService)

    expect(generateCSS(['font:bold'], languageService.css)).toContain('.font\\:bold')
    expect(generateCSS(['animate:fade'], languageService.css)).toContain('@keyframes fade')
    expect(suggest(languageService, '')?.find(({ label }) => label === 'block')?.documentation).toBeTruthy()
    expect(suggest(languageService, 'text-center:')?.find(({ label }) => label === ':hover')?.documentation).toBeTruthy()

    expect(snapshotLanguageCSS(languageService)).toEqual(before)
})
