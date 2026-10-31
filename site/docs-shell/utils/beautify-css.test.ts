import assert from 'node:assert/strict'
import { test } from 'node:test'
import { beautifyCSS } from './beautify-css'

test('beautifyCSS keeps query comparisons and selector combinators spaced', () => {
  assert.equal(beautifyCSS('@media (width>=52.125rem){.fg\\:red\\@md>*+*{color:red}}'), [
    '@media (width >= 52.125rem) {',
    '  .fg\\:red\\@md > * + * {',
    '    color: red',
    '  }',
    '}',
    ''
  ].join('\n'))
  assert.equal(beautifyCSS('@media (40rem <= width < 64rem) {a{b:c}}').split('\n')[0], '@media (40rem <= width < 64rem) {')
  assert.equal(beautifyCSS('@container card (inline-size>=30rem){a{b:c}}').split('\n')[0], '@container card (inline-size >= 30rem) {')
  assert.equal(beautifyCSS('@custom-media --md (width >= 48rem);').trim(), '@custom-media --md (width >= 48rem);')
  // Escaped class characters and strings are not combinators.
  assert.equal(beautifyCSS('.w\\:calc\\(100\\%\\+2rem\\){content:"a>=b"}').split('\n')[0], '.w\\:calc\\(100\\%\\+2rem\\) {')
  assert.match(beautifyCSS('.a{content:"a>=b"}'), /content: "a>=b"/)
})
