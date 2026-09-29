import './ignore-css-imports'
import { fileURLToPath } from 'node:url'

const { generate } = await import('./generate-llms-txt')
await generate(fileURLToPath(new URL('../', import.meta.url)))
