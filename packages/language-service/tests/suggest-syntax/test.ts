import { test, it, expect, describe } from 'vitest'
import CSSLanguageService from '../../src/core'
import createDoc from '../../src/utils/create-doc'
import { Settings } from '../../src/settings'
import { createPresetPlan } from '../helpers/create-preset-plan'

export const hint = (target: string, settings: Settings = {}) => {
    const contents = [`<div class="`, target, `"></div>`]
    const doc = createDoc('html', contents.join(''))
    const languageService = new CSSLanguageService({
        ...settings,
        plan: createPresetPlan(settings.plan)
    })
    return languageService.suggestSyntax(doc, doc.positionAt(contents[0].length + target.length), {
        triggerKind: 2,
        triggerCharacter: target.charAt(target.length - 1)
    })
}

// it.concurrent('types a', () => expect(hint('a')?.length).toBeDefined())

it.concurrent('types " should hint completions', () => expect(hint('')?.length).toBeGreaterThan(0))
it.concurrent('types   should hint completions', () => expect(hint('text:center ')?.length).toBeGreaterThan(0))

test.todo('types any trigger character in "" should not hint')
test.todo(`types any trigger character in '' should not hint`)

// enhanced

/**
 * <div></div> -> <div class=""></div>
 */
test.todo('emit class="" should hint completions')
