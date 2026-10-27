/* global require, exports, process, setTimeout */
/* eslint-disable @typescript-eslint/no-require-imports -- VS Code loads this extension test runner as CommonJS. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vscode = require('vscode')

exports.run = async () => {
  const records = []
  const unhandled = []
  const onUnhandled = error => unhandled.push(String(error))
  process.on('unhandledRejection', onUnhandled)
  const save = value => {
    records.push(value)
    fs.writeFileSync(process.env.MASTER_CSS_AUDIT_RESULT, JSON.stringify({ vscode: vscode.version, records }, null, 2))
  }
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const poll = async (read, accept, label) => {
    const deadline = Date.now() + 15000
    let value
    while (Date.now() < deadline) {
      value = await read()
      if (accept(value)) return value
      await pause(100)
    }
    throw new Error(`${label}: ${JSON.stringify(value)}`)
  }
  let command
  try {
    const extension = vscode.extensions.all.find(item => item.extensionPath === process.env.MASTER_CSS_AUDIT_EXTENSION)
    assert(extension)
    await extension.activate()
    const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'index.html')
    const document = await vscode.workspace.openTextDocument(uri)
    const editor = await vscode.window.showTextDocument(document)
    editor.selection = new vscode.Selection(0, 14, 0, 14)
    const hover = async () => (await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, new vscode.Position(0, 14)) ?? [])
      .flatMap(item => item.contents.map(content => typeof content === 'string' ? content : content.value)).join('\n')
    const tokens = async () => Array.from((await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', uri))?.data ?? [])
    const config = vscode.workspace.getConfiguration('masterCSS', uri)
    await poll(hover, value => value.includes('color:'), 'initial hover')
    const active = await poll(tokens, value => value.length > 0, 'active tokens')
    assert(!(await vscode.commands.getCommands(true)).includes('eslint.restart'))
    let start = unhandled.length
    await vscode.commands.executeCommand('masterCSS.restart')
    await poll(hover, value => value.includes('color:'), 'manual restart hover')
    await pause(1500)
    const manual = unhandled.slice(start).filter(value => value.includes('eslint.restart'))
    assert.equal(manual.length, 0)
    start = unhandled.length
    await config.update('embeddedSyntaxHighlighting', 'always', vscode.ConfigurationTarget.Workspace)
    await poll(tokens, value => value.length > active.length, 'always tokens after settings restart')
    await poll(hover, value => value.includes('color:'), 'settings restart hover')
    await pause(1500)
    const absent = unhandled.slice(start).filter(value => value.includes('eslint.restart'))
    save({ stage: 'absent-command', manual, setting: absent, activeTokens: active.length, alwaysTokens: (await tokens()).length })
    if (process.env.BH_VSCODE_BEFORE) {
      assert(absent.length > 0, 'current source reproduces missing optional command rejection')
      save({ complete: true, baseline: 'BH-0035 reproduced in actual VS Code' })
      return
    }
    assert.equal(absent.length, 0)

    // Synthetic optional command endpoints exercise VS Code dispatch/failure;
    // this is not a claim to have installed or tested the real ESLint extension.
    let calls = 0
    command = vscode.commands.registerCommand('eslint.restart', () => { calls++ })
    await vscode.commands.executeCommand('masterCSS.restart')
    assert.equal(calls, 1)
    await config.update('embeddedSyntaxHighlighting', 'off', vscode.ConfigurationTarget.Workspace)
    await poll(() => calls, value => value === 2, 'registered settings restart dispatched once')
    await poll(tokens, value => value.length === 0, 'off tokens')
    save({ stage: 'registered-command', calls, manual: 1, settings: 1 })
    command.dispose()
    command = vscode.commands.registerCommand('eslint.restart', () => { calls++; throw new Error('BH-0035 injected optional restart failure') })
    start = unhandled.length
    await config.update('embeddedSyntaxHighlighting', 'active', vscode.ConfigurationTarget.Workspace)
    await poll(() => calls, value => value === 3, 'failing command reached')
    await poll(tokens, value => value.length === active.length, 'active tokens after failure')
    await poll(hover, value => value.includes('color:'), 'hover after optional command failure')
    await pause(1500)
    assert(!unhandled.slice(start).some(value => value.includes('BH-0035 injected')))
    save({ stage: 'registered-command-failure', calls, unhandled: unhandled.slice(start), hoverWorks: true })
    command.dispose()
    command = undefined
    await config.update('embeddedSyntaxHighlighting', 'always', vscode.ConfigurationTarget.Workspace)
    await poll(tokens, value => value.length > active.length, 'removed command settings restart')
    await pause(1500)
    assert(!unhandled.some(value => value.includes('eslint.restart') || value.includes('BH-0035 injected')))
    save({ stage: 'removed-command', calls, complete: true, active: extension.isActive })
  } catch (error) {
    save({ error: String(error), stack: error.stack })
    throw error
  } finally {
    command?.dispose()
    process.removeListener('unhandledRejection', onUnhandled)
  }
}
