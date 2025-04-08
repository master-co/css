import { test, expect, describe } from 'vitest'
import generateAt from '../../src/utils/generate-at'
import { cases } from './parse-at.test'

describe.concurrent.each(Object.entries(cases))('%s', (_, caseGroup) => {
    test.concurrent.each(caseGroup)('%s', (_, output, atRule) => {
        expect(generateAt(atRule)).toEqual(output)
    })
})