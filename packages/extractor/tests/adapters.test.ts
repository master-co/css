import { describe, expect, test } from 'vitest'
import CSSExtractor from '../src'

describe('extractor source adapters', () => {
    test('uses custom adapters before built-in source adapters', async () => {
        const adapter = {
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

    test('uses built-in HTML and OXC adapters from @master/css-source by default', async () => {
        const extractor = await new CSSExtractor({
            include: []
        }).init()

        expect(extractor.extract('index.html', `
            <div class="block mi:auto"></div>
            <script>const classes = 'fg:red'</script>
        `)).toEqual(['block', 'mi:auto', 'fg:red'])

        expect(extractor.extract('component.tsx', `
            const classes = 'inline-flex'
            export function App() {
                return <div className="hidden" />
            }
        `)).toEqual(['inline-flex', 'hidden'])
    })
})
