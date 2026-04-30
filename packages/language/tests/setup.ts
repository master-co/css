import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Registry, INITIAL, type IGrammar } from 'vscode-textmate'
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma'

const SYNTAX_DIR = resolve(__dirname, '..', 'syntaxes')

let wasmLoaded = false
async function ensureWasm() {
    if (wasmLoaded) return
    // The shipped WASM lives under `vscode-oniguruma/release/onig.wasm`.
    const wasmPath = require.resolve('vscode-oniguruma/release/onig.wasm')
    await loadWASM(readFileSync(wasmPath).buffer)
    wasmLoaded = true
}

async function loadShikiGrammars(name: string) {
    // @shikijs/langs ships pre-converted vscode TextMate grammars per language.
    const mod = await import(`@shikijs/langs/${name}`)
    const arr = (mod.default ?? mod) as any
    return Array.isArray(arr) ? arr : [arr]
}

const masterCssGrammars: Record<string, any> = {
    'source.master-css': JSON.parse(readFileSync(resolve(SYNTAX_DIR, 'master-css.json'), 'utf8')),
    'source.master-css.injection-class': JSON.parse(readFileSync(resolve(SYNTAX_DIR, 'master-css.injection-class.json'), 'utf8')),
    'source.master-css.injection-react': JSON.parse(readFileSync(resolve(SYNTAX_DIR, 'master-css.injection-react.json'), 'utf8')),
    'source.master-css.injection-vue': JSON.parse(readFileSync(resolve(SYNTAX_DIR, 'master-css.injection-vue.json'), 'utf8')),
    'source.master-css.injection-string': JSON.parse(readFileSync(resolve(SYNTAX_DIR, 'master-css.injection-string.json'), 'utf8')),
    'source.master-css.injection-js': JSON.parse(readFileSync(resolve(SYNTAX_DIR, 'master-css.injection-js.json'), 'utf8')),
}

interface GrammarRegistry {
    grammar: IGrammar
}

/**
 * Build a vscode-textmate Registry that can tokenize the given host language
 * (e.g. `tsx`, `html`) with all master-css injection grammars applied.
 */
export async function loadGrammar(host: 'tsx' | 'html' | 'vue'): Promise<GrammarRegistry> {
    await ensureWasm()
    const hostGrammars = await loadShikiGrammars(host)

    const grammars = new Map<string, any>()
    for (const g of hostGrammars) grammars.set(g.scopeName, g)
    for (const [scope, g] of Object.entries(masterCssGrammars)) {
        grammars.set(scope, g)
    }

    const injections = Object.keys(masterCssGrammars).filter(s => s.includes('injection-'))

    const registry = new Registry({
        onigLib: Promise.resolve({
            createOnigScanner: (patterns) => new OnigScanner(patterns),
            createOnigString: (s) => new OnigString(s),
        }),
        loadGrammar: async (scope) => grammars.get(scope) ?? null,
        getInjections: () => injections,
    })

    const hostScope = host === 'tsx'
        ? 'source.tsx'
        : host === 'html'
            ? 'text.html.basic'
            : 'source.vue'

    const grammar = await registry.loadGrammar(hostScope)
    if (!grammar) throw new Error(`Failed to load host grammar: ${hostScope}`)

    return { grammar }
}

interface TokenScopeInfo {
    text: string
    scopes: string[]
}

/** Tokenize a single line; returns tokens with text + scope chain. */
export function tokenize(grammar: IGrammar, line: string): TokenScopeInfo[] {
    const r = grammar.tokenizeLine(line, INITIAL)
    return r.tokens.map(t => ({
        text: line.slice(t.startIndex, t.endIndex),
        scopes: t.scopes,
    }))
}

/** Find the token that contains the given substring in `text`. */
export function findToken(tokens: TokenScopeInfo[], substring: string): TokenScopeInfo | undefined {
    return tokens.find(t => t.text.includes(substring))
}

// Master-css injection emits these distinctive scopes; their presence on a
// token indicates that the master-css grammar successfully ran on it.
export const MCSS_FINGERPRINTS = [
    'support.type.property-name.css',
    'variable.argument.css',
    'support.function.misc.css',
    'punctuation.separator.key-value.css',
    'punctuation.separator.master-css',
    'entity.other.attribute-name.class.css',
]

export function hasMcssScope(scopes: string[]): boolean {
    return scopes.some(s => MCSS_FINGERPRINTS.includes(s))
}

export function hasCommentScope(scopes: string[]): boolean {
    return scopes.some(s => s.startsWith('comment.'))
}
