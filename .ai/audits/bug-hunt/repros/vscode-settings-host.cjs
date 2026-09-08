const assert = require('node:assert/strict')
const fs = require('node:fs')
const vscode = require('vscode')

exports.run = async function run() {
  const records = []
  const save = (value) => {
    records.push(value)
    fs.writeFileSync(process.env.MASTER_CSS_AUDIT_RESULT, JSON.stringify({ vscode: vscode.version, records }, null, 2))
  }
  const poll = async (read, accepts, label) => {
    const end = Date.now() + 15000
    let value
    while (Date.now() < end) {
      value = await read()
      if (accepts(value)) return value
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`${label}: ${JSON.stringify(value)}`)
  }
  try {
    const extension = vscode.extensions.all.find(item => item.extensionPath === process.env.MASTER_CSS_AUDIT_EXTENSION)
    assert(extension)
    await extension.activate()
    const root = vscode.workspace.workspaceFolders[0].uri
    const uri = vscode.Uri.joinPath(root, 'index.html')
    const document = await vscode.workspace.openTextDocument(uri)
    const editor = await vscode.window.showTextDocument(document)
    editor.selection = new vscode.Selection(0, 14, 0, 14)
    const tokens = async () => {
      const result = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', uri)
      return Array.from(result?.data ?? [])
    }
    const hover = async () => {
      const result = await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, new vscode.Position(0, 14))
      return (result ?? []).flatMap(item => item.contents.map(content => typeof content === 'string' ? content : content.value)).join('\n')
    }
    await poll(hover, value => value.includes('color:'), 'initial hover')
    if (process.env.BH_VSCODE_CONTROL) {
      assert(!(await vscode.commands.getCommands(true)).includes('eslint.restart'))
      console.log('AUDIT_MANUAL_RESTART_BEGIN')
      await vscode.commands.executeCommand('masterCSS.restart')
      await poll(hover, value => value.includes('color:'), 'hover after manual restart')
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log('AUDIT_MANUAL_RESTART_END')
      console.log('AUDIT_SETTING_RESTART_BEGIN')
      await vscode.workspace.getConfiguration('masterCSS', uri).update('embeddedSyntaxHighlighting', 'always', vscode.ConfigurationTarget.Workspace)
      await poll(hover, value => value.includes('color:'), 'hover after setting restart')
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log('AUDIT_SETTING_RESTART_END')
      save({ control: 'same host without ESLint', manualRestart: true, settingRestart: true, hoverStillWorks: true, complete: true })
      return
    }
    const active = await poll(tokens, value => value.length > 0, 'initial active tokens')
    save({ stage: 'active', tokenData: active, hover: await hover() })
    const config = vscode.workspace.getConfiguration('masterCSS', uri)
    for (const mode of ['always', 'off', 'active']) {
      await config.update('embeddedSyntaxHighlighting', mode, vscode.ConfigurationTarget.Workspace)
      const data = await poll(tokens, value => mode === 'always' ? value.length > active.length : mode === 'off' ? value.length === 0 : value.length === active.length, `tokens after ${mode}`)
      await poll(hover, value => value.includes('color:'), `hover after ${mode}`)
      save({ stage: mode, tokenData: data, hover: await hover() })
    }
    const edit = new vscode.WorkspaceEdit()
    edit.replace(uri, new vscode.Range(0, 12, 0, 18), 'grid')
    await vscode.workspace.applyEdit(edit)
    const updated = await poll(hover, value => value.includes('display: grid'), 'versioned hover after setting restarts')
    save({ stage: 'updated-document', version: document.version, hover: updated })
    const cssUri = vscode.Uri.joinPath(root, 'style.css')
    const cssDocument = await vscode.workspace.openTextDocument(cssUri)
    await vscode.window.showTextDocument(cssDocument)
    const format = async () => {
      const edits = await vscode.commands.executeCommand('vscode.executeFormatDocumentProvider', cssUri, { tabSize: 2, insertSpaces: true })
      let text = cssDocument.getText()
      for (const edit of [...(edits ?? [])].sort((a, b) => cssDocument.offsetAt(b.range.start) - cssDocument.offsetAt(a.range.start))) {
        text = text.slice(0, cssDocument.offsetAt(edit.range.start)) + edit.newText + text.slice(cssDocument.offsetAt(edit.range.end))
      }
      return { count: edits?.length ?? 0, text }
    }
    for (const enabled of [false, true, false, true]) {
      await config.update('formatDirectives', enabled, vscode.ConfigurationTarget.Workspace)
      const formatted = await poll(format, value => enabled ? value.text.includes('bg:transparent!;') : value.count === 0, `format after ${enabled}`)
      save({ stage: 'format', enabled, ...formatted })
    }
    save({ complete: true, active: extension.isActive })
  } catch (error) { save({ error: String(error), stack: error.stack }); throw error }
}
