import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { declarationProgram, publicDeclaration, formatDeclaration, ts } from '../reference/package-declarations'

export function declarationTokens(text: string) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text)
  const tokens: [number, string][] = []
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) tokens.push([token, scanner.getTokenText()])
  return tokens
}

export async function verifyDeclarationPresentation() {
  const root = await mkdtemp(path.join(tmpdir(), 'master-doc-declarations-'))
  try {
    const file = path.join(root, 'index.ts')
    await writeFile(path.join(root, 'factory.ts'), 'export default function createSession() { return true; }')
    await writeFile(file, `
export { default as createSession } from './factory';
export class Session {
  #state = 0;
  private disposed = false;
  private constructor() {}
  protected label = 'session';
  read(value: string): string;
  read(value: number): number;
  read(value: string | number) { return value; }
  async render(options = { enabled: true }) { return options.enabled; }
  private helper() { return this.#state; }
  static { void 0; }
}
export class Named {
  constructor(public name = 'ready') {}
}
export function configure(options: { readonly manifest: { version: 1 }; readonly classNames?: readonly string[]; readonly signal?: AbortSignal } = { manifest: { version: 1 } }) { return options.manifest; }
export function combine(firstConfiguration: string, secondConfiguration: string, thirdConfiguration: string) { return firstConfiguration; }
function factory() { return { enabled: true, count: 1 }; }
export default factory();
export const literal = 'unchanged';
export { Named as Renamed };
`)
    const program = declarationProgram([file], { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, strict: true, skipLibCheck: true })
    assert.deepEqual(program.getSemanticDiagnostics().map((diagnostic: any) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')), [])
    const checker = program.getTypeChecker()
    const source = program.getSourceFile(file)
    const symbols = checker.getExportsOfModule(checker.getSymbolAtLocation(source))
    const declarations = Object.fromEntries(symbols.map((symbol: any) => {
      const actual = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
      const text = publicDeclaration(actual, checker)
      const formatted = formatDeclaration(text)
      assert.deepEqual(declarationTokens(formatted), declarationTokens(text), symbol.name)
      return [symbol.name, formatted]
    })) as Record<string, string>
    assert.doesNotMatch(declarations.Session, /#state|#private|disposed|helper|static\s*\{|async\s+render|read\(value: string \| number\)/)
    assert.match(declarations.Session, /private constructor\(\)/)
    assert.match(declarations.Session, /protected label: string/)
    assert.equal((declarations.Session.match(/read\(/g) ?? []).length, 2)
    assert.match(declarations.Session, /render\(options\?:/)
    assert.match(declarations.Named, /name: string/)
    assert.match(declarations.Named, /constructor\(name\?: string\)/)
    assert.match(declarations.default, /declare const _default:/)
    assert.doesNotMatch(declarations.default, /factory\(\)|declare const default/)
    assert.match(declarations.literal, /literal: "unchanged"/)
    assert.match(declarations.createSession, /^export declare function createSession\(\): boolean;/)
    assert.match(declarations.combine, /combine\(\n/)
    assert.equal(declarations.Renamed, declarations.Named)
  } finally { await rm(root, { recursive: true, force: true }) }
}
