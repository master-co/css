import { readFileSync } from 'fs'
import { render } from '../../../src'
import path from 'path'

it('removes comments in transformPageChunk can break Svelte\'s hydration', () => {
    const html = render(readFileSync(path.join(__dirname, './prerendering.html')).toString()).html
    expect(html).toContain('<!-- HEAD_svelte-zo7lox_START -->')
    expect(html).toContain('<!-- HEAD_svelte-zo7lox_END -->')
})