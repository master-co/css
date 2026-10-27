import { createRequire } from 'node:module'

/** Build-time only; reuse the repository's compiler-API compatibility dependency. */
export const ts = createRequire(new URL('../../package.json', import.meta.url))('typescript6')

/** Emit in memory so signatures follow TypeScript's actual declaration rules. */
export function declarationProgram(files: string[], options: any) {
  const emitOptions = { ...options, noEmit: false, declaration: true, emitDeclarationOnly: true, noEmitOnError: false, declarationMap: false, incremental: false }
  const sourceProgram = ts.createProgram(files, emitOptions)
  const declarations = new Map<string, string>()
  const result = sourceProgram.emit(undefined, (file: string, text: string, _bom: boolean, _error: unknown, sources: any[]) => {
    if (/\.d\.[cm]?ts$/.test(file)) for (const source of sources ?? []) declarations.set(source.fileName, text)
  }, undefined, true)
  if (result.diagnostics.length) throw new Error(ts.formatDiagnostics(result.diagnostics, {
    getCanonicalFileName: (file: string) => file, getCurrentDirectory: ts.sys.getCurrentDirectory, getNewLine: () => '\n'
  }))
  const host = ts.createCompilerHost({ ...options, noEmit: true })
  const getSourceFile = host.getSourceFile
  host.getSourceFile = (file: string, ...args: any[]) => {
    const text = declarations.get(file)
    if (text === undefined) return getSourceFile(file, ...args)
    // Preserve source paths for module resolution, but bind declaration-only text.
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    source.isDeclarationFile = true
    return source
  }
  return ts.createProgram(files, { ...options, noEmit: true }, host)
}

/** Display every public declaration, retaining inaccessible constructor barriers. */
export function publicDeclaration(symbol: any, checker: any): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  return (symbol.declarations ?? []).map((node: any) => {
    if (!node.getSourceFile().isDeclarationFile) throw new Error(`Missing declaration emission for ${node.getSourceFile().fileName}#${symbol.name}`)
    let declaration = node
    // A source file's default can be a named export at the public entrypoint.
    // The contract builder owns that export mapping, not the defining module.
    if (node.name && node.modifiers?.some((modifier: any) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
      const modifiers = node.modifiers.filter((modifier: any) => modifier.kind !== ts.SyntaxKind.DefaultKeyword)
      if (!modifiers.some((modifier: any) => modifier.kind === ts.SyntaxKind.DeclareKeyword)) modifiers.push(ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword))
      declaration = ts.factory.replaceModifiers(node, modifiers)
    }
    if (ts.isVariableDeclaration(node) || ts.isBindingElement(node)) {
      const type = node.type ?? checker.typeToTypeNode(checker.getTypeOfSymbolAtLocation(symbol, node), node, ts.NodeBuilderFlags.NoTruncation)
      declaration = ts.factory.createVariableStatement([ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)], ts.factory.createVariableDeclarationList([
        ts.factory.createVariableDeclaration(symbol.name, undefined, type, undefined)
      ], ts.NodeFlags.Const))
    }
    if (ts.isClassDeclaration(node)) {
      const members = node.members.filter((member: any) => ts.isConstructorDeclaration(member)
        || !ts.isPrivateIdentifier(member.name ?? {}) && !member.modifiers?.some((modifier: any) => modifier.kind === ts.SyntaxKind.PrivateKeyword))
      declaration = ts.factory.updateClassDeclaration(node, declaration.modifiers, node.name, node.typeParameters, node.heritageClauses, members)
    }
    ts.setEmitFlags(declaration, ts.EmitFlags.NoLeadingComments)
    return printer.printNode(ts.EmitHint.Unspecified, declaration, node.getSourceFile()).trim()
  }).join('\n')
}

export function declarationComment(symbol: any): string {
  return [...new Set<string>((symbol.declarations ?? []).flatMap((node: any) => (node.jsDoc ?? []).map((doc: any) =>
    doc.getText().replace(/^\/\*\*|\*\/$/g, '').split('\n').map((line: string) => line.replace(/^\s*\* ?/, '').trimEnd()).join('\n').trim()
  )))].join('\n\n')
}

/** Wrap parameter lists at syntax boundaries; never split identifiers or literals. */
export function formatDeclaration(text: string): string {
  const source = ts.createSourceFile('declaration.d.ts', text, ts.ScriptTarget.Latest, true)
  const inserts = new Map<number, string>()
  function visit(node: any) {
    if (node.parameters?.length && (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)
      || ts.isMethodSignature(node) || ts.isConstructorDeclaration(node) || ts.isFunctionTypeNode(node))) {
      const start = node.getStart(source)
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      const indent = text.slice(lineStart, start).match(/^\s*/)?.[0] ?? ''
      const signature = text.slice(start, node.end)
      if (signature.split('\n').some((line: string) => line.length > 84)) {
        for (const parameter of node.parameters) inserts.set(parameter.getStart(source), `\n${indent}  `)
        const close = text.indexOf(')', node.parameters.end)
        if (close >= 0 && close < node.end) inserts.set(close, `\n${indent}`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  for (const [position, value] of [...inserts].sort((a, b) => b[0] - a[0])) text = text.slice(0, position) + value + text.slice(position)
  return text.replace(/ +\n/g, '\n').replace(/^\s*\/\/ eslint[^\n]*\n/gm, '')
}
