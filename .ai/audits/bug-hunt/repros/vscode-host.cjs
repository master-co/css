const assert = require('node:assert/strict')
const fs = require('node:fs')
const vscode = require('vscode')

exports.run = async function run() {
  const extension = vscode.extensions.all.find((item) => item.extensionPath === process.env.MASTER_CSS_AUDIT_EXTENSION)
  assert.ok(extension, 'staged extension discovered')
  await extension.activate()
  assert.equal(extension.isActive, true)
  const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'index.html')
  const document = await vscode.workspace.openTextDocument(uri)
  await vscode.window.showTextDocument(document)
  const hoverText = async () => {
    const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, new vscode.Position(0, 16))
    return hovers.flatMap((hover) => hover.contents.map((content) => typeof content === 'string' ? content : content.value)).join('\n')
  }
  let first = ''
  for (let attempt = 0; attempt < 20; attempt++) {
    first = await hoverText()
    if (first.includes('color:')) break
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  assert.match(first, /color:/)
  await vscode.commands.executeCommand('masterCSS.restart')
  const edit = new vscode.WorkspaceEdit()
  edit.replace(uri, new vscode.Range(0, 12, 0, 18), 'block')
  await vscode.workspace.applyEdit(edit)
  let updated = ''
  for (let attempt = 0; attempt < 20; attempt++) {
    updated = await hoverText()
    if (updated.includes('display:')) break
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  assert.match(updated, /display:/)
  fs.writeFileSync(process.env.MASTER_CSS_AUDIT_RESULT, JSON.stringify({
    vscode: vscode.version, active: extension.isActive, first, updated, documentVersion: document.version
  }, null, 2))
}
