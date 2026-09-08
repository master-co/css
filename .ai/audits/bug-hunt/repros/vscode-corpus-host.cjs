const assert = require('node:assert/strict')
const fs = require('node:fs')
const vscode = require('vscode')

exports.run = async function run() {
  const records = []
  const save = value => {
    records.push(value)
    fs.writeFileSync(process.env.MASTER_CSS_AUDIT_RESULT, JSON.stringify({ vscode: vscode.version, records }, null, 2))
  }
  const hoverText = results => (results ?? []).flatMap(item => item.contents.map(content => typeof content === 'string' ? content : content.value)).join('\n')
  const poll = async (read, accepts) => {
    const end = Date.now() + 12000
    let value
    do {
      value = await read()
      if (accepts(value)) return value
      await new Promise(resolve => setTimeout(resolve, 100))
    } while (Date.now() < end)
    return value
  }
  try {
    const extension = vscode.extensions.all.find(item => item.extensionPath === process.env.MASTER_CSS_AUDIT_EXTENSION)
    assert(extension)
    await extension.activate()
    const root = vscode.workspace.workspaceFolders[0].uri
    const cases = [
      ['index.html', 'bg:blue', 'background-color:', 'html'],
      ['inspect-syntax.html', 'btn', 'display: inline-flex', 'html'],
      ['suggest-syntax.html', 'fg:global', 'color:', 'html'],
      ['has-check.html', 'bg:amber-30:has(:checked)', ':has(:checked)', 'html'],
      ['edit-syntax-colors.html', 'fg:rgb(0|255|145)', 'color:', 'html'],
      ['render-syntax-colors.tsx', 'bg:blue', 'background-color:', 'typescriptreact'],
      ['suggest-syntax.ts', 'text-center', 'text-align: center', 'typescript'],
      ['suggest-syntax.tsx', 'text-center', 'text-align: center', 'typescriptreact'],
      ['suggest-syntax.astro', 'text-center', 'text-align: center', 'astro'],
      ['suggest-syntax.svelte', 'text-center', 'text-align: center', 'svelte'],
      ['suggest-syntax.vue', 'italic', 'font-style: italic', 'vue'],
      ['dlight.view.js', 'fg:blue-50:hover', 'color:', 'javascript'],
      ['packages/a/index.html', 'fg:custom', 'color:', 'html'],
      ['packages/b/index.html', 'fg:custom', 'color:', 'html'],
      ['packages/c/index.html', 'fg:global', 'color:', 'html'],
      ['packages/d/index.html', 'fg:global', 'color:', 'html']
    ]
    for (const [file, token, expected, language] of cases) {
      const uri = vscode.Uri.joinPath(root, file)
      const doc = await vscode.workspace.openTextDocument(uri)
      await vscode.window.showTextDocument(doc)
      const offset = doc.getText().indexOf(token)
      assert(offset >= 0, `${file} target exists`)
      const position = doc.positionAt(offset + Math.min(2, token.length - 1))
      const hover = await poll(async () => hoverText(await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, position)), value => value.includes(expected))
      const completionOffset = offset + (token.includes(':') ? token.indexOf(':') + 1 : Math.min(3, token.length))
      const completion = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, doc.positionAt(completionOffset))
      const colors = await vscode.commands.executeCommand('vscode.executeDocumentColorProvider', uri)
      const semantic = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', uri)
      save({ file, language: doc.languageId, expectedLanguage: language, token, expectedHover: expected,
        hoverPass: hover.includes(expected), hover,
        completionPosition: doc.positionAt(completionOffset), completions: (completion?.items ?? []).map(item => ({ label: item.label, detail: item.detail })),
        colors: (colors ?? []).map(item => ({ text: doc.getText(item.range), range: item.range, color: item.color })),
        semanticData: Array.from(semantic?.data ?? []), diagnostics: vscode.languages.getDiagnostics(uri) })
      if (file === 'edit-syntax-colors.html') {
        const presentations = []
        for (const item of colors ?? []) {
          const edits = await vscode.commands.executeCommand('vscode.executeColorPresentationProvider', new vscode.Color(0.2, 0.4, 0.6, 0.5), { uri, range: item.range })
          presentations.push({ original: doc.getText(item.range), edits,
            rangePass: (edits ?? []).every(edit => edit.textEdit?.range.isEqual(item.range) && edit.textEdit.newText === edit.label) })
        }
        save({ feature: 'color-presentations', file, presentations })
      }
    }
    for (const file of ['index.css', 'styles/card.css', 'packages/a/index.css', 'packages/b/index.css']) {
      const uri = vscode.Uri.joinPath(root, file)
      const doc = await vscode.workspace.openTextDocument(uri)
      await vscode.window.showTextDocument(doc)
      const edits = await vscode.commands.executeCommand('vscode.executeFormatDocumentProvider', uri, { tabSize: 2, insertSpaces: true })
      let formatted = doc.getText()
      for (const edit of [...(edits ?? [])].sort((a, b) => doc.offsetAt(b.range.start) - doc.offsetAt(a.range.start))) {
        formatted = formatted.slice(0, doc.offsetAt(edit.range.start)) + edit.newText + formatted.slice(doc.offsetAt(edit.range.end))
      }
      save({ feature: 'css-format-diagnostics', file, original: doc.getText(), formatted, edits,
        diagnostics: vscode.languages.getDiagnostics(uri), documentDirty: doc.isDirty })
    }
    save({ complete: true, active: extension.isActive, cases: cases.length,
      hoverPassed: records.filter(item => item.hoverPass).length,
      languagePassed: records.filter(item => item.expectedLanguage && item.expectedLanguage === item.language).length,
      extensions: vscode.extensions.all.filter(item => /^(Vue.volar|svelte.svelte-vscode|astro-build.astro-vscode)$/i.test(item.id)).map(item => ({ id: item.id, version: item.packageJSON.version, active: item.isActive })) })
  } catch (error) { save({ error: String(error), stack: error.stack }); throw error }
}
