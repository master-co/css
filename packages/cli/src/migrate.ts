import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { migrateRCSync } from '@master/css-compiler/node'
import type { MasterCSSRCMigrationResult } from '@master/css-compiler'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }

export interface MigrateOptions {
  cwd?: string
  manifest?: string
  targetManifest?: string
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
  const cwd = path.resolve(options.cwd || process.cwd())
  const manifestPath = path.resolve(cwd, options.manifest || 'master.rc.manifest.json')
  // An unreadable original manifest is fatal. Never substitute the new preset
  // or default settings for a project we could not load.
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>
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
  const files = paths.map(filePath => ({
    filePath,
    source: fs.readFileSync(filePath, 'utf8'),
    languageId: languageByExtension[path.extname(filePath)] || 'html'
  }))
  const language = createLanguageSessionSync({ manifest: targetManifest })
  const contexts: { file: number, positions: ReturnType<typeof language.analyzeDocument>['classPositions'] }[] = []
  try {
    for (const [file, input] of files.entries()) {
      if (input.languageId === 'css') continue
      const analysis = language.analyzeDocument({ source: input.source, languageId: input.languageId })
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
  const result = migrateRCSync({ manifest, targetManifest, targetIsPreset: !options.targetManifest,
    classLists: contexts.map(context => context.positions.map(position => position.token)),
    stylesheets: stylesheets.map(file => file.source),
    documents: files.map(file => file.languageId === 'css' ? '' : file.source)
  })
  const reports = files.map(file => ({
    path: path.relative(cwd, file.filePath),
    edits: [] as { start: number, end: number, before: string, after: string }[],
    review: [] as { before: string, notes: readonly string[] }[],
    written: false
  }))
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
  const report = { version: 1, mode: options.write ? 'write' : 'preview', manifest: manifestPath, files: reports }
  console.log(JSON.stringify(report, null, 2))
  return report
}
