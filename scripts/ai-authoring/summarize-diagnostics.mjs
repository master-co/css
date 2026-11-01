import { readFile, writeFile } from 'node:fs/promises'
import { summarizeDiagnostics } from './diagnostic-summary.mjs'

const [input, output, ...extra] = process.argv.slice(2)
if (!input || extra.length) throw new Error('Usage: node scripts/ai-authoring/summarize-diagnostics.mjs acceptance.json [new-summary.json]')
const summary = summarizeDiagnostics(JSON.parse(await readFile(input, 'utf8')))
const json = JSON.stringify(summary, null, 2) + '\n'
if (output) await writeFile(output, json, { flag: 'wx' })
else process.stdout.write(json)
