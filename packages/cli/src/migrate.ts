import { discoverManifestEntriesSync } from '@master/css-compiler/project/sync'
import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { migrateRCSync, resolveStylesheetDependenciesSync } from '@master/css-compiler/node'
import type { MasterCSSRCMigrationResult } from '@master/css-compiler'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }

export interface MigrateOptions {
  from?: 'rc-legacy' | 'rc-named' | 'rc-native' | 'rc-managed' | 'rc-utilities'
  sourceVersion?: string
  cwd?: string
  manifest?: string
  targetManifest?: string
  entry?: string
  write?: boolean
}

type Proposal = MasterCSSRCMigrationResult['classLists'][number][number]
const sourcePattern = '**/*.{html,htm,js,jsx,cjs,mjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,css}'
const languageByExtension: Record<string, string> = {
  '.js': 'javascript', '.jsx': 'javascriptreact', '.mjs': 'javascript', '.cjs': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescriptreact', '.mts': 'typescript', '.cts': 'typescript',
  '.vue': 'vue', '.svelte': 'svelte', '.astro': 'astro', '.css': 'css', '.md': 'markdown', '.mdx': 'mdx'
}

/** Filesystem orchestration only. All syntax and equivalence decisions are Rust-owned. */
export default function runMigrate(sourcePaths: string[], options: MigrateOptions = {}) {
  if (!options.from) throw new Error('Migration requires --from rc-legacy, rc-named, rc-native, rc-managed or rc-utilities.')
  const cwd = path.resolve(options.cwd || process.cwd())
  const manifestPath = path.resolve(cwd, options.manifest || 'master.rc.manifest.json')
  // An unreadable original manifest is fatal. Never substitute the new preset
  // or default settings for a project we could not load.
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>
  const sourceVersion = options.sourceVersion ?? manifest.packageVersion
  if (typeof sourceVersion !== 'string' || !sourceVersion.trim()) throw new Error('Record the actual RC package version with --source-version or manifest.packageVersion.')
  const targetManifest = (options.targetManifest
    ? JSON.parse(fs.readFileSync(path.resolve(cwd, options.targetManifest), 'utf8'))
    : defaultManifestJSON) as MasterCSSManifest
  const patterns = (sourcePaths.length ? sourcePaths : [sourcePattern]).map((input) => {
    const absolute = path.resolve(cwd, input)
    return fs.existsSync(absolute) && fs.statSync(absolute).isDirectory()
      ? `${input.replace(/\\/g, '/')}/${sourcePattern}` : input.replace(/\\/g, '/')
  })
  const paths = fg.sync(patterns, {
    cwd, absolute: true, onlyFiles: true, unique: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/target/**', '**/.next/**', '**/out/**']
  }).sort()
  const entries = options.entry ? [path.resolve(cwd, options.entry)] : [...discoverManifestEntriesSync({ root: cwd })]
  if (entries.length === 1 && !paths.includes(entries[0])) paths.push(entries[0])
  const files = paths.map(filePath => ({
    filePath,
    source: fs.readFileSync(filePath, 'utf8'),
    languageId: languageByExtension[path.extname(filePath)] || 'html'
  }))
  const language = createLanguageSessionSync({ manifest: targetManifest })
  const sourceErrors = new Map<number, readonly { message: string }[]>()
  const contexts: { file: number, positions: ReturnType<typeof language.analyzeDocument>['classPositions'] }[] = []
  try {
    for (const [file, input] of files.entries()) {
      if (input.languageId === 'css') continue
      const analysis = language.analyzeDocument({ source: input.source, languageId: input.languageId })
      if (analysis.diagnostics.length) sourceErrors.set(file, analysis.diagnostics)
      const groups = new Map<string, typeof analysis.classPositions[number][]>()
      for (const position of analysis.classPositions) {
        const key = `${position.contextRange.start}:${position.contextRange.end}`
        const positions = groups.get(key) || []
        positions.push(position)
        groups.set(key, positions)
      }
      for (const positions of groups.values()) contexts.push({ file, positions })
    }
  } finally { language.dispose() }
  const stylesheets = files.filter(file => file.languageId === 'css')
  // Imports are read-only migration context even when the caller selected only
  // the entry. A native function in an imported sheet can shadow an RC macro.
  const dependencySources = new Map<string, string>()
  for (const entry of new Set([...entries, ...stylesheets.map(file => file.filePath)])) {
    const source = files.find(file => file.filePath === entry)?.source ?? fs.readFileSync(entry, 'utf8')
    const resolved = resolveStylesheetDependenciesSync(entry, source, { projectDir: cwd })
    for (const dependency of resolved.dependencies) {
      if (!files.some(file => file.filePath === dependency)) dependencySources.set(dependency, fs.readFileSync(dependency, 'utf8'))
    }
  }
  const result = migrateRCSync({ from: options.from, sourceVersion, manifest, targetManifest, targetIsPreset: !options.targetManifest,
    classLists: contexts.map(context => context.positions.map(position => position.token)),
    stylesheets: [...stylesheets.map(file => file.source), ...dependencySources.values()],
    documents: files.map(file => file.languageId === 'css' ? '' : file.source)
  })
  const reports = files.map(file => ({
    path: path.relative(cwd, file.filePath),
    edits: [] as { start: number, end: number, before: string, after: string }[],
    review: [] as { before: string, notes: readonly string[] }[],
    written: false
  }))
  for (const [index, diagnostics] of sourceErrors) reports[index].review.push({ before: '(source)', notes: diagnostics.map(diagnostic => diagnostic.message) })
  if (result.notes.length && reports.length) reports[0].review.push({ before: '(configuration)', notes: result.notes })
  for (const [index, notes] of result.documents.entries()) {
    if (notes.length) reports[index].review.push({ before: '(source)', notes })
  }
  for (const [index, context] of contexts.entries()) {
    const file = files[context.file]
    const report = reports[context.file]
    for (const [item, position] of context.positions.entries()) {
      const proposal: Proposal = result.classLists[index][item]
      if (proposal.status === 'unchanged') continue
      if (proposal.status === 'review') {
        report.review.push({ before: proposal.before, notes: proposal.notes })
      } else if (position.raw !== position.token || file.source.slice(position.range.start, position.range.end) !== position.raw) {
        report.review.push({ before: position.raw, notes: ['Escaped source spelling requires manual migration.'] })
      } else if (proposal.after !== null) {
        report.edits.push({ start: position.range.start, end: position.range.end, before: position.raw, after: proposal.after })
      }
    }
  }
  for (const [index, file] of stylesheets.entries()) {
    const report = reports[files.indexOf(file)]
    const stylesheet = result.stylesheets[index]
    report.edits.push(...stylesheet.edits.map(edit => ({ ...edit.range, before: edit.before, after: edit.after })))
    if (stylesheet.notes.length) report.review.push({ before: '(stylesheet)', notes: stylesheet.notes })
  }
  if (result.configurationCSS && options.from === 'rc-native') {
    const entry = entries.length === 1 ? files.findIndex(file => file.filePath === entries[0]) : -1
    if (entry >= 0) reports[entry].edits.push({ start: files[entry].source.length, end: files[entry].source.length, before: '', after: `\n${result.configurationCSS}` })
    else if (reports.length) reports[0].review.push({ before: '(entry)', notes: ['Select a unique Master CSS entry with --entry to write the proposed custom variants.'] })
  }
  if (options.from !== 'rc-native' && result.configurationCSS && !stylesheets.some(file => file.source.includes('@settings') || file.source.includes('@mode ')) && reports.length) {
    reports[0].review.push({ before: '(configuration)', notes: ['Add the proposed configurationCSS to the project entry, regenerate --target-manifest, and review delivery mode and native pruning before applying this batch.'] })
  }
  for (const report of reports) {
    report.edits.sort((a, b) => a.start - b.start)
    if (report.edits.some((edit, index) => index > 0 && edit.start < report.edits[index - 1].end)) {
      report.review.push({ before: '(source)', notes: ['Overlapping source edits require manual review.'] })
    }
  }
  // Review the selected batch as a unit: dynamic classes, custom utilities,
  // selectors, and cascade changes may have cross-file dependencies.
  if (options.write && !reports.some(report => report.review.length)) {
    // Check every input before publishing the first edit.
    for (const [file, source] of dependencySources) {
      if (fs.readFileSync(file, 'utf8') !== source) throw new Error(`Migration dependency changed while planning: ${file}`)
    }
    for (const [index, file] of files.entries()) {
      if (fs.readFileSync(file.filePath, 'utf8') !== file.source) throw new Error(`Source changed while planning migration: ${reports[index].path}`)
    }
    for (const [index, report] of reports.entries()) {
      if (!report.edits.length) continue
      const file = files[index]
      let output = file.source
      for (const edit of [...report.edits].reverse()) output = output.slice(0, edit.start) + edit.after + output.slice(edit.end)
      fs.writeFileSync(file.filePath, output)
      report.written = true
    }
  }
  const report = { version: 2, from: options.from, sourceVersion, configurationCSS: result.configurationCSS, notes: result.notes, behaviorChanges: result.behaviorChanges, mode: options.write ? 'write' : 'preview', manifest: manifestPath, files: reports }
  console.log(JSON.stringify(report, null, 2))
  return report
}
