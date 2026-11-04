/* global require, exports, __dirname, setTimeout */
/* eslint-disable @typescript-eslint/no-require-imports -- VS Code loads this extension test runner as CommonJS. */
const assert = require('node:assert/strict')
const { readFileSync, writeFileSync, realpathSync } = require('node:fs')
const { join, relative, isAbsolute } = require('node:path')
const vscode = require('vscode')

async function eventually(operation, description) {
  const deadline = Date.now() + 45_000
  let error
  while (Date.now() < deadline) {
    try { return await operation() } catch (caught) { error = caught }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`${description}: ${error?.stack ?? error}`)
}

exports.run = async () => {
  const expected = JSON.parse(readFileSync(join(__dirname, 'expected.json'), 'utf8'))
  const extension = vscode.extensions.getExtension(expected.id)
  assert.ok(extension, `Installed extension ${expected.id} must be discoverable`)
  const installedRelative = relative(realpathSync(expected.extensionsDir), realpathSync(extension.extensionPath))
  assert.ok(installedRelative && !installedRelative.startsWith('..') && !isAbsolute(installedRelative))
  assert.equal(extension.packageJSON.version, expected.version)
  await extension.activate()
  assert.equal(extension.isActive, true)
  assert.ok((await vscode.commands.getCommands()).includes('masterCSS.restart'))
  const document = await vscode.workspace.openTextDocument({ language: 'html', content: '<div class="block block:"></div>' })
  await vscode.window.showTextDocument(document)
  const position = new vscode.Position(0, document.getText().indexOf('block:') + 6)
  const checkCompletion = () => eventually(async () => {
    const result = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', document.uri, position, ':')
    assert.ok(result?.items.some(item => (typeof item.label === 'string' ? item.label : item.label.label) === ':first-child'))
  }, 'Master CSS completion')
  await checkCompletion()
  await eventually(async () => {
    const hover = await vscode.commands.executeCommand('vscode.executeHoverProvider', document.uri,
      new vscode.Position(0, document.getText().indexOf('block') + 2))
    const markdown = (hover ?? []).flatMap(item => item.contents).map(content => typeof content === 'string' ? content : content.value).join('\n')
    assert.match(markdown, /display[^a-z]+block/)
  }, 'Master CSS hover')
  await vscode.commands.executeCommand('masterCSS.restart')
  await checkCompletion()
  writeFileSync(join(__dirname, 'host-proof.json'), JSON.stringify({
    id: extension.id, version: extension.packageJSON.version, vscode: vscode.version,
    extensionPath: extension.extensionPath, activated: true, completion: true, hover: true, restarted: true
  }, null, 2))
}
