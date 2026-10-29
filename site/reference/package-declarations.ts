import * as ast from 'typescript/unstable/ast'
import * as factory from 'typescript/unstable/ast/factory'
import { NodeBuilderFlags, SymbolFlags } from 'typescript/unstable/sync'
import { parseTypeScript } from '../../scripts/typescript-api.mjs'
import { openDeclarationProject } from '../../scripts/typescript-declarations.mjs'

export const ts = { ...ast, SymbolFlags }
const declarationSessions = new WeakMap<object, any>()

/** Query emitted declarations with TS7; source fixtures are compiled in a temporary tree. */
export function declarationProgram(files: string[], options: Record<string, unknown> = {}) {
  const session = openDeclarationProject(files, options)
  declarationSessions.set(session.checker, session)
  return {
    getSourceFile: session.sourceFile,
    getTypeChecker: () => session.checker,
    getSemanticDiagnostics: () => session.program.getSemanticDiagnostics(),
    close: session.close
  }
}

/** Display every public declaration, retaining inaccessible constructor barriers. */
export function publicDeclaration(symbol: any, checker: any): string {
  const session = declarationSessions.get(checker)
  if (!session) throw new Error('Unknown TypeScript declaration session')
  return (symbol.declarations ?? []).map((handle: any) => {
    const node = handle.resolve(session)
    if (!node) throw new Error(`Missing declaration for ${symbol.name}`)
    if (!node.getSourceFile().isDeclarationFile) throw new Error(`Missing declaration emission for ${node.getSourceFile().fileName}#${symbol.name}`)
    let declaration = node
    let declarationModifiers = node.modifiers
    // A source file's default can be a named export at the public entrypoint.
    // The contract builder owns that export mapping, not the defining module.
    if (node.name && node.modifiers?.some((modifier: any) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
      const modifiers = node.modifiers.filter((modifier: any) => modifier.kind !== ts.SyntaxKind.DefaultKeyword)
      if (!modifiers.some((modifier: any) => modifier.kind === ts.SyntaxKind.DeclareKeyword)) modifiers.push(factory.createToken(ts.SyntaxKind.DeclareKeyword))
      declarationModifiers = modifiers
      if (ts.isFunctionDeclaration(node)) declaration = factory.updateFunctionDeclaration(node, modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, node.body)
      else if (ts.isInterfaceDeclaration(node)) declaration = factory.updateInterfaceDeclaration(node, modifiers, node.name, node.typeParameters, node.heritageClauses, node.members)
    }
    if (ts.isVariableDeclaration(node) || ts.isBindingElement(node)) {
      const type = (ts.isVariableDeclaration(node) ? node.type : undefined) ?? checker.typeToTypeNode(checker.getTypeOfSymbolAtLocation(symbol, node), node, NodeBuilderFlags.NoTruncation)
      declaration = factory.createVariableStatement([factory.createToken(ts.SyntaxKind.DeclareKeyword)], factory.createVariableDeclarationList([
        factory.createVariableDeclaration(factory.createIdentifier(symbol.name), undefined, type, undefined)
      ], ts.NodeFlags.Const))
    }
    if (ts.isClassDeclaration(node)) {
      const members = node.members.filter((member: any) => ts.isConstructorDeclaration(member)
        || !ts.isPrivateIdentifier(member.name ?? {}) && !member.modifiers?.some((modifier: any) => modifier.kind === ts.SyntaxKind.PrivateKeyword))
      declaration = factory.updateClassDeclaration(node, declarationModifiers, node.name, node.typeParameters, node.heritageClauses, members)
    }
    return session.emitter.printNode(declaration).trim()
  }).join('\n')
}

export function declarationComment(symbol: any, checker: any): string {
  return checker.getDocumentationCommentOfSymbol(symbol)
}

/** Wrap parameter lists at syntax boundaries; never split identifiers or literals. */
export function formatDeclaration(text: string): string {
  const source = parseTypeScript('declaration.d.ts', text).sourceFile
  const inserts = new Map<number, string>()
  function visit(node: any) {
    if (node.parameters?.length && (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)
      || ts.isMethodSignatureDeclaration(node) || ts.isConstructorDeclaration(node) || ts.isFunctionTypeNode(node))) {
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
    node.forEachChild(visit)
  }
  visit(source)
  for (const [position, value] of [...inserts].sort((a, b) => b[0] - a[0])) text = text.slice(0, position) + value + text.slice(position)
  return text.replace(/ +\n/g, '\n').replace(/^\s*\/\/ eslint[^\n]*\n/gm, '')
}
