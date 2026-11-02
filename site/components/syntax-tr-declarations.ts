import { parseCSSDeclarations } from '@master/css-tooling/css'
import { generatePresetClasses } from '@master/internal-site/css/preset-css.ts'

export function generateSyntaxTrDeclarations(proxyCode: string, previewSyntax?: string) {
  const classNames = previewSyntax ? [proxyCode, previewSyntax] : [proxyCode]
  const generated = generatePresetClasses(classNames)
  const byClass = new Map(generated.classes.map((entry) => [entry.className, entry]))
  const rule = byClass.get(proxyCode)?.rules[0] ?? (previewSyntax ? byClass.get(previewSyntax)?.rules[0] : undefined)
  const declarations = rule ? parseCSSDeclarations(rule.text) : undefined

  if (!declarations || !Object.keys(declarations).length) {
    throw new Error(`SyntaxTr generated empty CSS declarations for \`${proxyCode}\`.`)
  }

  return declarations
}
