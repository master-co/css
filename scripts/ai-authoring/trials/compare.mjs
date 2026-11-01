import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { summarize } from '../evaluate.mjs'

const passed = row => row.functional && row.styling && row.accessibility && row.browser === 'passed'
const median = values => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/** Require the complete paired design; never silently compare different coverage. */
export function compare(protocol, rows) {
  if (protocol.profile !== 'bridge-pilot') throw new Error('Expected bridge-pilot protocol')
  summarize(rows) // Validate observations and duplicates before aggregation.
  const expected = new Set(protocol.tasks.flatMap(task => protocol.arms.flatMap(arm => protocol.models.flatMap(model =>
    Array.from({ length: protocol.repeats }, (_, repeat) => JSON.stringify([task, arm, model, repeat]))))))
  for (const row of rows) {
    if (!expected.delete(JSON.stringify([row.task, row.arm, row.model, row.repeat]))) throw new Error('Unexpected observation')
    if (row.client !== protocol.clientVersion || row.fixtureRevision !== protocol.revision + ':' + protocol.corpusHash || row.toolVersion !== protocol.toolVersion) throw new Error('Mixed experiment environments')
    for (const value of [row.cachedInputTokens, row.modelDurationMs, row.mcpCalls, row.mcpErrors, row.bridgeCalls?.cli, row.bridgeCalls?.cliErrors, row.bridgeCalls?.mcp]) {
      if (!Number.isSafeInteger(value) || value < 0) throw new Error('Missing transport or timing metric')
    }
    if (row.inputTokens === null || row.outputTokens === null) throw new Error('Unmeasured token usage')
    if (row.cachedInputTokens > row.inputTokens) throw new Error('Invalid cached input count')
    if (row.arm === 'skill-cli' ? row.mcpCalls !== 0 : row.bridgeCalls.cli !== 0) throw new Error('Cross-arm tool contamination')
  }
  if (expected.size) throw new Error(`Incomplete paired coverage: ${expected.size} missing`)
  const totals = selection => ({
    trials: selection.length, passed: selection.filter(passed).length,
    firstPass: selection.filter(row => passed(row) && row.repairRounds === 0).length,
    repairs: selection.reduce((n, row) => n + row.repairRounds, 0),
    inputTokens: selection.reduce((n, row) => n + row.inputTokens, 0),
    cachedInputTokens: selection.reduce((n, row) => n + row.cachedInputTokens, 0),
    outputTokens: selection.reduce((n, row) => n + row.outputTokens, 0),
    medianDurationMs: median(selection.map(row => row.durationMs)),
    medianModelDurationMs: median(selection.map(row => row.modelDurationMs)),
    mcpCalls: selection.reduce((n, row) => n + row.mcpCalls, 0),
    mcpErrors: selection.reduce((n, row) => n + row.mcpErrors, 0),
    cliSuggestions: selection.reduce((n, row) => n + row.bridgeCalls.cli, 0),
    cliSuggestionErrors: selection.reduce((n, row) => n + row.bridgeCalls.cliErrors, 0),
    mcpSuggestions: selection.reduce((n, row) => n + row.bridgeCalls.mcp, 0),
    trialsUsingSuggestions: selection.filter(row => row.bridgeCalls.cli + row.bridgeCalls.mcp > 0).length,
    unmatched: selection.every(row => row.invalidClasses !== null) ? selection.reduce((n, row) => n + row.invalidClasses, 0) : null
  })
  const pairs = { cliWins: 0, mcpWins: 0, bothPass: 0, bothFail: 0 }
  for (const cli of rows.filter(row => row.arm === 'skill-cli')) {
    const mcp = rows.find(row => row.arm === 'skill-mcp-bridge' && row.task === cli.task && row.model === cli.model && row.repeat === cli.repeat)
    pairs[passed(cli) ? passed(mcp) ? 'bothPass' : 'cliWins' : passed(mcp) ? 'mcpWins' : 'bothFail']++
  }
  return {
    version: 1, profile: protocol.profile, revision: protocol.revision,
    arms: Object.fromEntries(protocol.arms.map(arm => [arm, totals(rows.filter(row => row.arm === arm))])),
    byModel: protocol.models.map(model => ({ model, arms: Object.fromEntries(protocol.arms.map(arm => [arm, totals(rows.filter(row => row.model === model && row.arm === arm))])) })),
    byTask: protocol.tasks.map(task => ({ task, arms: Object.fromEntries(protocol.arms.map(arm => [arm, totals(rows.filter(row => row.task === task && row.arm === arm))])) })),
    pairs,
    failures: rows.filter(row => !passed(row)).map(({ task, arm, model, repeat, execution, artifacts }) => ({ task, arm, model, repeat, execution, artifacts })),
    limitation: 'Small fixed-task pilot. CLI versus the full MCP surface, not transport alone. Suggestions are optional. Input tokens include cache hits; no billing estimate. Elapsed times include local concurrency; model time excludes independent grading.'
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/ai-authoring/trials/compare.mjs RUN_DIRECTORY')
  const root = resolve(process.argv[2])
  const protocol = JSON.parse(await readFile(join(root, 'protocol.json'), 'utf8'))
  const rows = (await readFile(join(root, 'observations.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line))
  const report = compare(protocol, rows)
  await writeFile(join(root, 'comparison.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}
