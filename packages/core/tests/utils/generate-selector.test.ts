import { test, expect, describe } from 'vitest'
import { generateSelector } from '../../src'
import { cases } from './parse-selector.test'

describe.concurrent.each(Object.entries(cases))('%s', (_, cases) => {
    test.concurrent.each(cases)('%s', (_, output, nodes, config, body) => {
        expect(generateSelector(nodes, body)).toBe(output)
    })
})
