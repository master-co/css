import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
for (const unit of (process.argv[2] ? [process.argv[2]] : ['eslint', 'eslint-legacy'])) {
 const cwd = resolve('examples', unit); const require = createRequire(resolve(cwd, 'package.json')); const { ESLint } = require('eslint')
 const plain = new ESLint({ cwd }); const paths = unit === 'eslint' ? ['src'] : ['*.html']; const initial = await plain.lintFiles(paths)
 console.log(JSON.stringify({ initial: initial.map(r => ({ path: r.filePath, messages: r.messages })) }))
 assert.equal(initial.reduce((sum, result) => sum + result.fatalErrorCount, 0), 0)
 const boundary = await plain.lintText('<div class="block block"></div>', { filePath: resolve(cwd, 'validation.html') }); console.log(JSON.stringify({ boundary: boundary[0].messages })); assert.ok(boundary[0].messages.length > 0)
 const fixer = new ESLint({ cwd, fix: true }); const fixed = await fixer.lintFiles(paths)
 const [deduped] = await fixer.lintText('<div class="block block"></div>', { filePath: resolve(cwd, 'validation.html') }); assert.equal(deduped.output, '<div class="block"></div>'); const [stable] = await fixer.lintText(deduped.output, { filePath: resolve(cwd, 'validation.html') }); assert.equal(stable.output, undefined)
 let changed = 1
 for (const result of fixed) { if (result.output !== undefined) { changed++; const [again] = await fixer.lintText(result.output, { filePath: result.filePath }); assert.equal(again.output, undefined, result.filePath + ' converges') } }
 console.log(JSON.stringify({ unit, files: initial.length, diagnostics: initial.map(r => ({ path: r.filePath, messages: r.messages.map(m => ({ ruleId: m.ruleId, line: m.line, message: m.message })) })), inMemoryFixedFiles: changed, convergence: 'PASS' }, null, 2))
}
