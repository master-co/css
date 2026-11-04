import './bundler-imports'

// These outputs are generated and ignored; tests always rebuild their fixtures.
await import('../prepare')
const { generate } = await import('./generate-llms-txt')
await generate(new URL('..', import.meta.url).pathname)
await import('./generate-llms-txt.test')
await import('./localization-exports.test')
await import('./article-exports.test')
