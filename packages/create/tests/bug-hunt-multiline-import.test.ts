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
