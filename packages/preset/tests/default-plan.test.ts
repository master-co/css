import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileCSSConfigFile } from '@master/css-compiler'
import { createCSS } from '@master/css-engine'
import { decodeMasterCSSPlan, encodeMasterCSSPlan } from '@master/css-engine/plan-codec'
import defaultPlan from '../src/default-plan'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('@master/css-preset defaultPlan', () => {
    it('matches the compiled preset CSS source', () => {
        const { plan } = compileCSSConfigFile(resolve(__dirname, '../src/index.css'))
        expect(defaultPlan).toEqual(decodeMasterCSSPlan(encodeMasterCSSPlan(plan)))
    })

    it('preserves JSON-safe template placeholders', () => {
        const css = createCSS(defaultPlan)
        const text = [
            css.create('gradient(#000,#fff)')?.text,
            css.create('grid-cols:3')?.text,
            css.create('lines:3')?.text,
            css.create('text:2xl')?.text
        ].join('')
        expect(text).toContain('background-image:linear-gradient(#000,#fff)')
        expect(text).toContain('grid-template-columns:repeat(3,minmax(0,1fr))')
        expect(text).toContain('-webkit-line-clamp:3')
        expect(text).not.toContain('null')
    })
})
