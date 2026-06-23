import { describe, expect, test } from 'vitest'
import CSSScanner from '../src'

describe('scanner source adapters', () => {
    test('uses custom adapters before built-in source adapters', async () => {
        const adapter = {
            name: 'test',
            test: /\.txt$/,
            extract: () => ['block']
        }
        const scanner = await new CSSScanner({
            adapters: [adapter]
        }).init()

        expect(scanner.collectCandidates('fixture.txt', 'hidden')).toEqual(['block'])
    })

    test('uses built-in HTML and OXC adapters from @master/css-source by default', async () => {
        const scanner = await new CSSScanner({}).init()

        expect(scanner.collectCandidates('index.html', `
            <div class="block mx:auto"></div>
            <script>const classes = 'fg:red'</script>
        `)).toEqual(['block', 'mx:auto', 'fg:red'])

        expect(scanner.collectCandidates('component.tsx', `
            const classes = 'inline-flex'
            export function App() {
                return <div className="hidden" />
            }
        `)).toEqual(['inline-flex', 'hidden'])
    })
})
