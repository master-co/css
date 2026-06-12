import { describe, expect, test } from 'vitest'
import CSSExtractor, {
    extractHTMLClasses,
    extractOxcClasses,
    matchesSourceAdapter,
    type SourceAdapter
} from '../src'

describe('built-in source adapters', () => {
    test('extracts static classes from JavaScript and TypeScript syntax with Oxc', () => {
        expect(extractOxcClasses('component.tsx', `
            const classes = 'block mx:auto'
            const active = clsx('fg:red', { 'p:16': ok })
            element.classList.add('flex')
            export function App() {
                return <div className="hidden m:8" />
            }
        `)).toEqual([
            'block',
            'mx:auto',
            'fg:red',
            'p:16',
            'flex',
            'hidden',
            'm:8'
        ])
    })

    test('ignores module specifiers, require calls, dynamic imports, and common directives with Oxc', () => {
        expect(extractOxcClasses('component.tsx', `
            'use client'
            import React from 'react'
            export { helper } from 'pkg'
            await import('lazy-module')
            const fs = require('fs')
            const classes = 'block fg:red'
        `)).toEqual([
            'block',
            'fg:red'
        ])
    })

    test('extracts class attributes and script strings from HTML', () => {
        expect(extractHTMLClasses('index.html', `
            <div class="block mx:auto"></div>
            <script>
                element.classList.add('fg:red', 'p:16')
                const classes = 'flex hidden'
            </script>
        `)).toEqual([
            'block',
            'mx:auto',
            'fg:red',
            'p:16',
            'flex',
            'hidden'
        ])
    })

    test('uses the first matching adapter instead of the raw extractor', async () => {
        const adapter: SourceAdapter = {
            name: 'test',
            test: /\.txt$/,
            extract: () => ['block']
        }
        const extractor = await new CSSExtractor({
            include: [],
            adapters: [adapter]
        }).init()

        expect(extractor.extract('fixture.txt', 'hidden')).toEqual(['block'])
    })

    test('matches adapters with global regular expressions consistently', () => {
        const adapter: SourceAdapter = {
            name: 'global-regexp',
            test: /\.txt$/g,
            extract: () => []
        }

        expect(matchesSourceAdapter(adapter, 'a.txt')).toBe(true)
        expect(matchesSourceAdapter(adapter, 'b.txt')).toBe(true)
    })
})
