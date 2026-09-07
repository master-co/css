import { dirname, isAbsolute, relative, resolve } from 'node:path'
import fg from 'fast-glob'
import {
  collectStandaloneCSSDirectiveExtractionPolicy,
  createCSSDirectiveExtractionPolicy,
  findStandaloneCSSDirectiveStatements,
  mergeCSSDirectiveExtractionPolicy,
  removeStandaloneCSSDirectives,
  resolveCSSImportGraph,
  resolveCSSImportGraphSource,
  type StandaloneCSSDirectiveStatement
} from '../node-compiler'
import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives'

export type StylesheetDirectives = CSSDirectiveExtractionPolicy
export type StylesheetDirectiveStatement = StandaloneCSSDirectiveStatement

export interface StylesheetSourceOptions {
  include?: readonly string[]
  exclude?: readonly string[]
  safelist?: readonly string[]
  blocklist?: readonly (string | RegExp)[]
}

export interface CollectedStylesheetDirectives {
  directives: StylesheetDirectives
  dependencies: string[]
}

export function createStylesheetDirectives(): StylesheetDirectives {
  return createCSSDirectiveExtractionPolicy()
}

export function hasStylesheetDirectives(directives?: StylesheetDirectives) {
  return Boolean(directives && (
    directives.include.length
    || directives.exclude.length
    || directives.safelist.length
    || directives.blocklist.length
    || directives.preserveNative
  ))
}

export function hasStylesheetSourceDirectives(directives?: StylesheetDirectives) {
  return Boolean(directives && (directives.include.length || directives.exclude.length))
}

function normalizePath(source: string) {
  return source.replace(/\\/g, '/')
}

function normalizeSourcePattern(pattern: string, file?: string, cwd = process.cwd()) {
  if (pattern.startsWith('./') || pattern.startsWith('../')) {
    const absolutePattern = resolve(file ? dirname(file) : cwd, pattern)
    return normalizePath(relative(cwd, absolutePattern) || '.')
  }
  if (isAbsolute(pattern)) return normalizePath(relative(cwd, pattern) || '.')
  return normalizePath(pattern)
}

export function mergeStylesheetDirectives(...directives: (Partial<StylesheetDirectives> | undefined)[]) {
  return mergeCSSDirectiveExtractionPolicy(...directives)
}

export function mergeStylesheetSourceOptions<T extends StylesheetSourceOptions>(
  options: T,
  directives?: StylesheetDirectives
): T {
  if (!directives) return options
  return {
    ...options,
    include: [...new Set([...(options.include || []), ...directives.include])],
    exclude: [...new Set([...(options.exclude || []), ...directives.exclude])],
    safelist: [...new Set([...(options.safelist || []), ...directives.safelist])],
    blocklist: [...(options.blocklist || []), ...directives.blocklist]
  } as T
}

export function findStylesheetDirectiveStatements(source: string): StylesheetDirectiveStatement[] {
  return findStandaloneCSSDirectiveStatements(source)
}

export function removeStylesheetDirectiveStatements(source: string) {
  const code = removeStandaloneCSSDirectives(source)
  return { code, removed: code !== source }
}

export function collectStylesheetDirectives(
  source: string,
  file?: string,
  cwd = process.cwd()
): StylesheetDirectives {
  const directives = collectStandaloneCSSDirectiveExtractionPolicy(source)
  directives.include = directives.include.map((pattern) => normalizeSourcePattern(pattern, file, cwd))
  directives.exclude = directives.exclude.map((pattern) => normalizeSourcePattern(pattern, file, cwd))
  return directives
}

export function collectStylesheetDirectivesFromCSSGraph(
  file: string,
  source?: string,
  cwd = process.cwd()
): CollectedStylesheetDirectives {
  const filename = resolve(file)
  const graph = source === undefined
    ? resolveCSSImportGraph(filename, { projectDir: cwd, expandPackageImports: false })
    : resolveCSSImportGraphSource(filename, source, { projectDir: cwd, expandPackageImports: false })
  return {
    directives: collectStylesheetDirectives(graph.source, filename, cwd),
    dependencies: graph.dependencies
  }
}

export function resolveStylesheetSourcePaths(options: StylesheetSourceOptions, cwd = process.cwd()) {
  const paths = new Set<string>()
  if (options.include?.length) {
    for (const sourcePath of fg.sync([...options.include], {
      cwd,
      ignore: options.exclude ? [...options.exclude] : undefined
    })) {
      if (sourcePath) paths.add(sourcePath)
    }
  }
  return [...paths]
}
