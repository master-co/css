import { expect, test } from 'vitest'
import { extractHTMLClassesNative } from '../../src/source/native'
import { extractSvelteClasses } from '../../src/source/adapters/svelte'

test('BH-0010 decodes HTML class character references before extraction', () => {
  expect(extractHTMLClassesNative('index.html', '<div class="block&#32;hidden"></div>'))
    .toEqual(['block', 'hidden'])
})

test('BH-0011 extracts classes in both Svelte conditional branches', async () => {
  const classes = await extractSvelteClasses('Component.svelte', `
    <script>let enabled = true</script>
    {#if enabled}<div class="block"></div>{:else}<div class="hidden"></div>{/if}
  `)
  expect(classes).toEqual(['block', 'hidden'])
})
