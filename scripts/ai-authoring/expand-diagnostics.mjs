import { readFile, appendFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { createHash } from 'node:crypto'
import { expandDiagnostics } from './diagnostic-navigation.mjs'

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  property: { type: 'string' }, check: { type: 'string' }, node: { type: 'string' }, all: { type: 'boolean' }, log: { type: 'string' }
} })
if (positionals.length !== 1) throw new Error('Usage: node expand-diagnostics.mjs ACCEPTANCE.json (--property NAME [--check ID] [--node INDEX] | --all) [--log REQUESTS.jsonl]')
let record
try {
  const bytes = await readFile(positionals[0])
  record = { request: { property: values.property, check: values.check, node: values.node, all: values.all ?? false }, reportHash: createHash('sha256').update(bytes).digest('hex') }
  if (values.node !== undefined && !/^\d+$/.test(values.node)) throw new Error('Invalid node index')
  const result = expandDiagnostics(JSON.parse(bytes), { ...values, node: values.node === undefined ? undefined : Number(values.node) })
  const output = JSON.stringify(result, null, 2) + '\n'
  record = { ...record, ok: true, bytes: Buffer.byteLength(output), outputHash: createHash('sha256').update(output).digest('hex'), groups: result.evidence?.length ?? result.diagnostics?.evidence?.length ?? 0 }
  process.stdout.write(output)
} catch (error) {
  record = { ...record, ok: false, error: error.message }
  console.error(error.message)
  process.exitCode = 1
} finally {
  if (values.log) await appendFile(values.log, JSON.stringify(record) + '\n')
}
