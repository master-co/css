import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const tasks = JSON.parse(readFileSync(new URL('./tasks.json', import.meta.url), 'utf8'))
export const arms = ['instructions', 'skill', 'mcp', 'skill-mcp', 'skill-mcp-bridge', 'skill-cli', 'skill-import-a', 'skill-import-b', 'skill-diagnostics-a', 'skill-diagnostics-b']

/** Summarize observed runs only. Missing attempts and unchecked UI are never successes. */
export function summarize(runs) {
  const seen = new Set()
  const groups = new Map()
  const taskIds = new Set(tasks.map(task => task.id))
  for (const run of runs) {
    if (!taskIds.has(run.task) || !arms.includes(run.arm)) throw new Error('Unknown task or arm')
    for (const field of ['model', 'client', 'fixtureRevision', 'toolVersion']) {
      if (typeof run[field] !== 'string' || !run[field].trim()) throw new Error(`Missing ${field}`)
    }
    for (const field of ['repeat', 'repairRounds', 'toolCalls', 'durationMs']) {
      if (!Number.isSafeInteger(run[field]) || run[field] < 0) throw new Error(`Invalid ${field}`)
    }
    for (const field of ['invalidClasses', 'inputTokens', 'outputTokens']) {
      if (run[field] !== null && (!Number.isSafeInteger(run[field]) || run[field] < 0)) throw new Error(`Invalid ${field}`)
    }
    for (const field of ['functional', 'styling', 'accessibility']) {
      if (typeof run[field] !== 'boolean') throw new Error(`Missing ${field} verdict`)
    }
    if (!['passed', 'failed', 'not-checked'].includes(run.browser)) throw new Error('Invalid browser verdict')
    const groupKey = JSON.stringify([run.arm, run.model, run.client, run.fixtureRevision, run.toolVersion])
    const key = JSON.stringify([groupKey, run.task, run.repeat])
    if (seen.has(key)) throw new Error(`Duplicate run: ${run.task}`)
    seen.add(key)
    const group = groups.get(groupKey) ?? {
      arm: run.arm, model: run.model, client: run.client, fixtureRevision: run.fixtureRevision, toolVersion: run.toolVersion,
      attempts: 0, passed: 0, firstPass: 0, withinTwoRepairs: 0, browserUnchecked: 0,
      invalidClasses: 0, toolCalls: 0, inputTokens: 0, outputTokens: 0, durationMs: 0, tasks: new Set(),
      unmeasured: { invalidClasses: 0, inputTokens: 0, outputTokens: 0 }
    }
    group.attempts++
    group.tasks.add(run.task)
    const passed = run.functional && run.styling && run.accessibility && run.browser === 'passed'
    group.passed += Number(passed)
    group.firstPass += Number(passed && run.repairRounds === 0)
    group.withinTwoRepairs += Number(passed && run.repairRounds <= 2)
    group.browserUnchecked += Number(run.browser === 'not-checked')
    for (const field of ['invalidClasses', 'toolCalls', 'inputTokens', 'outputTokens', 'durationMs']) {
      if (run[field] === null) group.unmeasured[field]++
      else group[field] += run[field]
    }
    groups.set(groupKey, group)
  }
  return [...groups.values()].map(({ tasks: completed, ...group }) => ({
    ...group,
    taskCoverage: completed.size,
    missingTasks: tasks.map(task => task.id).filter(id => !completed.has(id)),
    successRate: group.passed / group.attempts,
    firstPassRate: group.firstPass / group.attempts,
    withinTwoRepairsRate: group.withinTwoRepairs / group.attempts
  }))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--list') {
      process.stdout.write(`${JSON.stringify({ tasks, arms }, null, 2)}\n`)
    } else if (process.argv[2] === '--summarize' && process.argv[3]) {
      const runs = readFileSync(process.argv[3], 'utf8').split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line))
      if (!runs.length) throw new Error('No observed runs')
      process.stdout.write(`${JSON.stringify(summarize(runs), null, 2)}\n`)
    } else {
      throw new Error('Usage: node scripts/ai-authoring/evaluate.mjs --list | --summarize results.jsonl')
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
