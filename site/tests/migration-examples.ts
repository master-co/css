import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript6'

const require = createRequire(import.meta.url)
export const vendorMigrationSlugs = ['bootstrap', 'material-ui', 'sass', ''] as const
export const migrationSlugs = ['css', 'css-in-js', 'tailwindcss', 'v1'] as const

export function migrationSource(slug: string) {
  return readFileSync(new URL(`../app/[locale]/guide/migration/${slug}/content.mdx`, import.meta.url), 'utf8')
}

export function migrationFences(slug: string) {
  return [...migrationSource(slug).matchAll(/```(\w+)[^\n]*\n([\s\S]*?)```/g)].map(match => ({ language: match[1], text: match[2] }))
}

export function compileMigrationExample(source: string) {
  return ts.transpileModule(source, {
    fileName: 'migration-example.tsx', reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
  })
}

/** Execute only the selected, repository-authored component specimen in tests. */
export function renderMigrationExample(source: string, name: string, props: Record<string, unknown>) {
  const compiled = compileMigrationExample(source)
  if (compiled.diagnostics?.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(compiled.diagnostics, {
    getCanonicalFileName: file => file, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n'
  }))
  const exports: Record<string, ComponentType<any>> = {}
  const localRequire = (specifier: string) => specifier === './Button.module.css' ? { button: 'migration-module-button' } : require(specifier)
  new Function('require', 'exports', compiled.outputText)(localRequire, exports)
  if (!exports[name]) throw new Error(`Missing example export: ${name}`)
  return renderToStaticMarkup(createElement(exports[name], props))
}
