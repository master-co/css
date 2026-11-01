import { readFile, readdir, readlink, mkdir, cp, writeFile, symlink } from 'node:fs/promises'
import { join, relative, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { cliWrapper } from './protocol.mjs'
import { check } from './check.mjs'
import { summarizeDiagnostics } from '../diagnostic-summary.mjs'
import { navigateDiagnostics } from '../diagnostic-navigation.mjs'

export const digest = bytes => createHash('sha256').update(bytes).digest('hex')
export const passed = verdict => verdict.functional && verdict.styling && verdict.accessibility && verdict.browser === 'passed'
export const excluded = new Set(['acceptance.json', 'diagnostics.json', 'bridge-calls.jsonl', 'review-390.png', 'review-1280.png', '.output.css.master-css.json'])

export async function treeHashes(root) {
  const result = {}
  async function visit(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = join(directory, entry.name), name = relative(root, file)
      if (entry.isSymbolicLink()) {
        if (name !== 'node_modules') throw new Error(`Unexpected symlink: ${name}`)
        result[name] = digest('symlink:' + await readlink(file))
      } else if (entry.isDirectory()) await visit(file)
      else result[name] = digest(await readFile(file))
    }
  }
  await visit(root)
  return result
}

export async function selectRepairSeeds(source, calibration = false) {
  const protocolBytes = await readFile(join(source, 'protocol.json'))
  const protocol = JSON.parse(protocolBytes)
  if (protocol.profile !== 'diagnostics-pilot') throw new Error('Expected a diagnostic feedback campaign')
  const rows = await Promise.all((await readdir(source)).filter(file => file.endsWith('.result.json')).sort().map(async file => ({ id: file.slice(0, -'.result.json'.length), ...JSON.parse(await readFile(join(source, file), 'utf8')) })))
  const expected = new Set(protocol.tasks.flatMap(task => protocol.arms.flatMap(arm => protocol.models.flatMap(model => Array.from({ length: protocol.repeats }, (_, repeat) => JSON.stringify([task, arm, model, repeat]))))))
  for (const row of rows) if (!expected.delete(JSON.stringify([row.task, row.arm, row.model, row.repeat]))) throw new Error('Unexpected/duplicate source trial')
  if (!calibration && expected.size) throw new Error('Source campaign is incomplete')
  const seeds = []
  for (const row of rows) {
    const folder = join(source, row.id), bytes = await readFile(join(folder, 'attempt-0.acceptance.json'))
    const verdict = JSON.parse(bytes)
    if (passed(verdict)) continue
    const execution = row.execution[0]
    if (execution.exit.code !== 0 || execution.timedOut || execution.unavailable || execution.hostSkillRead || verdict.browser !== 'failed') throw new Error('Failed source must be a measured task failure')
    const events = (await readFile(join(folder, 'attempt-0.events.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse)
    if (events.some(event => event.type === 'turn.failed')) throw new Error('Failed source model execution')
    const answer = events.filter(event => event.type === 'item.completed' && event.item?.type === 'agent_message').map(event => event.item.text).join('\n')
    seeds.push({ id: `seed-${String(seeds.length + 1).padStart(2, '0')}`, originalId: row.id, task: row.task, folder, originalModel: row.model,
      originalAcceptanceHash: digest(bytes), prompt: await readFile(join(folder, 'attempt-0.prompt.txt'), 'utf8'), answer,
      skill: protocol.skillVariants[row.arm] })
  }
  if (!seeds.length) throw new Error('No failed first attempts')
  return { sourceProtocolHash: digest(protocolBytes), sourceObservationHash: digest(await readFile(join(source, 'observations.jsonl'))), seeds }
}

export async function prepareRepairSeed(seed, destination, browser, repository, presentation = 'compact') {
  const folder = join(destination, seed.id), work = join(folder, 'work'), baseline = join(folder, 'baseline')
  await mkdir(work, { recursive: true })
  await cp(join(seed.folder, 'baseline'), baseline, { recursive: true })
  const snapshot = join(seed.folder, 'attempt-0.work')
  const originalHashes = {}
  for (const file of ['index.html', 'app.css', 'app.js', 'package.json', 'build.mjs', ...(await readdir(baseline)).filter(file => file.startsWith('source'))]) {
    const bytes = await readFile(join(snapshot, file))
    originalHashes[file] = digest(bytes)
    await writeFile(join(work, file), bytes)
  }
  await cp(join(snapshot, '.agents'), join(work, '.agents'), { recursive: true })
  await symlink(join(repository, 'node_modules'), join(work, 'node_modules'), 'dir')
  await writeFile(join(work, 'master-css.mjs'), cliWrapper(join(repository, 'packages/cli/dist/bin/index.js'), true))
  for (const [file, hash] of Object.entries(seed.skill.files)) if (digest(await readFile(join(work, '.agents/skills/master-css', file))) !== hash) throw new Error('Copied skill differs from recorded skill')
  const assessment = await check(work, seed.task, browser, repository, seed.answer, baseline)
  if (passed(assessment) || assessment.browser !== 'failed' || assessment.buildError || assessment.colorComparison.error) throw new Error('Seed no longer reproduces a measured failure')
  if (assessment.diagnostics.evidence.some(item => item.status === 'unavailable')) throw new Error('Incomplete initial diagnostic capture')
  // Both presentations use exactly the same replay; remove temporary workspace
  // prefixes so reported source locations are usable in either copied trial.
  let serialized = JSON.stringify(assessment)
  for (const directory of [work, baseline]) for (const prefix of [pathToFileURL(directory).href + '/', directory + '/']) serialized = serialized.split(prefix).join('./')
  const canonical = JSON.parse(serialized)
  if (!['compact', 'navigation'].includes(presentation)) throw new Error('Unknown presentation')
  if (presentation === 'navigation') {
    await mkdir(join(work, '.diagnostic-tools'))
    for (const file of ['expand-diagnostics.mjs', 'diagnostic-navigation.mjs', 'diagnostic-summary.mjs']) await cp(join(repository, 'scripts/ai-authoring', file), join(work, '.diagnostic-tools', file))
    await writeFile(join(work, '.diagnostic-evidence.json'), JSON.stringify(canonical, null, 2) + '\n')
  }
  const reports = { a: canonical.diagnostics, b: presentation === 'navigation' ? navigateDiagnostics(canonical) : summarizeDiagnostics(canonical) }
  const reportText = Object.fromEntries(Object.entries(reports).map(([arm, report]) => [arm, JSON.stringify(report, null, 2) + '\n']))
  for (const [arm, text] of Object.entries(reportText)) await writeFile(join(folder, `report-${arm}.json`), text)
  await writeFile(join(folder, 'assessment.json'), JSON.stringify(assessment, null, 2))
  const inputHashes = Object.fromEntries(Object.entries(await treeHashes(work)).filter(([name]) => !excluded.has(name)))
  const record = { ...seed, work, baseline, originalHashes, inputHashes, inputHash: digest(JSON.stringify(inputHashes)),
    failedChecks: canonical.checks.filter(check => !check.pass), reportHashes: Object.fromEntries(Object.entries(reportText).map(([arm, text]) => [arm, digest(text)])), reportBytes: Object.fromEntries(Object.entries(reportText).map(([arm, text]) => [arm, Buffer.byteLength(text)])) }
  await writeFile(join(folder, 'seed.json'), JSON.stringify(record, null, 2))
  return record
}

export async function copyRepairInput(seed, work, arm) {
  await cp(seed.work, work, { recursive: true, verbatimSymlinks: true, filter: file => !excluded.has(basename(file)) })
  const hashes = await treeHashes(work)
  if (digest(JSON.stringify(hashes)) !== seed.inputHash) throw new Error('Paired input copy differs')
  const report = await readFile(join(seed.work, '..', `report-${arm}.json`))
  if (digest(report) !== seed.reportHashes[arm]) throw new Error('Seed report changed')
  await writeFile(join(work, 'diagnostics.json'), report)
  return { inputHash: seed.inputHash, reportHash: digest(report), hashes }
}
