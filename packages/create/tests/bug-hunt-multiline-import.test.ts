import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ts from 'typescript6'
import { expect, it } from 'vitest'
import { applyMasterCSSSetupPlan, planMasterCSSSetup } from '../src'

// BH-0021: adding setup must preserve valid multiline imports in an existing config.
it.each([false, true])('keeps Vite config parseable with multiline=%s', (multiline) => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-bh-create-'))
    const file = join(root, 'vite.config.ts')
    try {
        writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', devDependencies: { vite: '*' } }))
        const imports = multiline ? "import {\n    defineConfig\n} from 'vite'" : "import { defineConfig } from 'vite'"
        writeFileSync(file, `${imports}\nexport default defineConfig({ plugins: [] })\n`)
        const plan = planMasterCSSSetup({ root, framework: 'vite', minimal: true, install: false })
        applyMasterCSSSetupPlan(plan, { install: false })
        const source = readFileSync(file, 'utf8')
        const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS) as ts.SourceFile & { parseDiagnostics: ts.Diagnostic[] }
        expect(parsed.parseDiagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')), source).toEqual([])
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

it.each([
    "import\n{ defineConfig }\nfrom 'vite'\n",
    "import data from './data.json'\nwith { type: 'json' }\nimport { defineConfig } from 'vite'\n",
    "import data from './data.json'\n/* attributes */\nwith { type: 'json' }\nimport { defineConfig } from 'vite'\n",
    "#!/usr/bin/env node\n'use client';\nimport {\n defineConfig\n} from 'vite'\n",
    "/* license */\n'use client';\nimport {\n defineConfig\n} from 'vite'\n",
    "import {\r\n defineConfig\r\n} from 'vite'\r\n"
])('preserves complete import boundaries and prologues: %s', (prefix) => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-bh-create-'))
    const file = join(root, 'vite.config.ts')
    const initial = prefix + 'export default defineConfig({ plugins: [] })\n'
    const parse = (source: string) => ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS) as ts.SourceFile & { parseDiagnostics: ts.Diagnostic[] }
    try {
        expect(parse(initial).parseDiagnostics).toEqual([])
        writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', devDependencies: { vite: '*' } }))
        writeFileSync(file, initial)
        applyMasterCSSSetupPlan(planMasterCSSSetup({ root, framework: 'vite', minimal: true, install: false }), { install: false })
        const source = readFileSync(file, 'utf8')
        const parsed = parse(source)
        expect(parsed.parseDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), source).toEqual([])
        if (prefix.includes("'use client'")) {
            expect(parsed.statements[0].getText()).toBe("'use client';")
        }
        if (prefix.startsWith('#!')) expect(source.startsWith('#!/usr/bin/env node\n')).toBe(true)
        applyMasterCSSSetupPlan(planMasterCSSSetup({ root, framework: 'vite', minimal: true, install: false }), { install: false })
        expect(readFileSync(file, 'utf8')).toBe(source)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})
