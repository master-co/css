import { languageOf } from '@master/internal-site/common/locales.js'
import { referenceText as text, referenceEditorial } from './copy'
import { spawn, execFileSync } from 'node:child_process'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { ReferenceDocument } from './types'
import { documentHeadings } from './headings'
import { mcpEditorial as sourceMcpEditorial, mcpPrompts as sourceMcpPrompts, mcpResultContract as sourceMcpResultContract } from './mcp-editorial'
import { cliEditorial as sourceCliEditorial } from './cli-editorial'
import { referenceIllustrationMarkdown } from './illustrations'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const fence = (lang: string, value: string) => `\`\`\`${lang}\n${value}\n\`\`\``

async function publicBin(repo: string, directory: string, name: string) {
  const root = path.join(repo, 'packages', directory)
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  if (!manifest.bin[name]) throw new Error(`Public binary missing: ${name}`)
  return path.resolve(root, manifest.bin[name])
}

/** Read the public MCP protocol; no tools/call, workspace mutation or private imports. */
export async function listMCPTools(binary: string) {
  const root = await mkdtemp(path.join(tmpdir(), 'master-reference-'))
  try {
    return await new Promise<any[]>((resolve, reject) => {
      const child = spawn(process.execPath, [binary, '--root', root], { stdio: ['pipe', 'pipe', 'pipe'] })
      let buffer = ''
      let settled = false
      const finish = (error?: Error, tools?: any[]) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        child.kill()
        error ? reject(error) : resolve(tools ?? [])
      }
      const timeout = setTimeout(() => finish(new Error('MCP contract discovery timed out; build @master/css-mcp first.')), 15000)
      const send = (message: object) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', ...message }) + '\n')
      child.on('error', error => finish(error))
      child.on('exit', code => { if (!settled) finish(new Error(`MCP contract discovery exited (${code}); build @master/css-mcp first.`)) })
      child.stdout.on('data', chunk => {
        buffer += chunk.toString()
        let end: number
        while ((end = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, end); buffer = buffer.slice(end + 1)
          if (!line.trim()) continue
          try {
            const message = JSON.parse(line)
            if (message.error) { finish(new Error(JSON.stringify(message.error))); return }
            if (message.id === 1) { send({ method: 'notifications/initialized' }); send({ id: 2, method: 'tools/list', params: {} }) }
            if (message.id === 2) finish(undefined, message.result.tools)
          } catch (error) { finish(error as Error) }
        }
      })
      send({ id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'master-reference-builder', version: '1' } } })
    })
  } finally { await rm(root, { recursive: true, force: true }) }
}

export async function buildToolContracts(repo: string, locale = 'en'): Promise<ReferenceDocument[]> {
  const mcpEditorial = referenceEditorial(sourceMcpEditorial, 'tools/mcp', locale, 'editorial')
  const mcpPrompts = referenceEditorial(sourceMcpPrompts, 'tools/mcp', locale, 'prompts')
  const mcpResultContract = referenceEditorial(sourceMcpResultContract, 'tools/mcp', locale, 'results')
  const cliEditorial = referenceEditorial(sourceCliEditorial, 'tools/cli', locale, 'editorial')
  const mcpBin = await publicBin(repo, 'mcp', 'master-css-mcp')
  const tools = await listMCPTools(mcpBin)
  const mcp = [
    text('tools/mcp', 'body-1', locale),
    text('tools/mcp', 'body-2', locale)
  ]
  mcp.push(text('tools/mcp', 'body-3', locale),
    [text('tools/mcp', 'body-4', locale), '| --- | --- |',
    text('tools/mcp', 'body-5', locale),
    text('tools/mcp', 'body-6', locale),
    text('tools/mcp', 'body-7', locale),
    text('tools/mcp', 'body-8', locale),
    text('tools/mcp', 'body-9', locale),
    text('tools/mcp', 'body-10', locale)].join('\n'),
    text('tools/mcp', 'body-11', locale),
    text('tools/mcp', 'body-12', locale),
    referenceIllustrationMarkdown('preview-file-identity', locale),
    text('tools/mcp', 'body-13', locale),
    text('tools/mcp', 'body-14', locale))
  for (const tool of tools) {
    const editorial = mcpEditorial[tool.name]
    if (!editorial) throw new Error(`Missing MCP guidance: ${tool.name}`)
    mcp.push(`## ${tool.name} {#${tool.name}}`, editorial.purpose, fence('json', JSON.stringify(editorial.example, null, 2)), editorial.lifecycle)
  }
  mcp.push(text('tools/mcp', 'body-15', locale),
    text('tools/mcp', 'body-16', locale),
    [text('tools/mcp', 'body-17', locale), '| --- | --- |', ...mcpPrompts.map(prompt => `| \`${prompt.name}\` | ${prompt.use} |`)].join('\n'),
    text('tools/mcp', 'body-18', locale), ...mcpResultContract)
  mcp.push(text('tools/mcp', 'body-19', locale),
    text('tools/mcp', 'body-20', locale))
  const cliBin = await publicBin(repo, 'cli', 'master-css')
  const rootHelp = execFileSync(process.execPath, [cliBin, '--help'], { encoding: 'utf8', timeout: 15000 })
  const commandNames = [...(rootHelp.split('Commands:\n')[1] ?? '').matchAll(/^ {2}([a-z][a-z-]*)(?:\s|$)/gm)].map(match => match[1]).filter(name => name !== 'help')
  if (!commandNames.length) throw new Error('No public CLI commands discovered')
  for (const name of Object.keys(cliEditorial)) if (!commandNames.includes(name)) throw new Error(`Stale CLI guidance: ${name}`)
  const cli = [
    text('tools/cli', 'body-23', locale),
    text('tools/cli', 'body-24', locale),
    text('tools/cli', 'body-25', locale)
  ]
  const effects: Record<string, string> = {
    suggest: text('tools/cli', 'body-26', locale),
    generate: text('tools/cli', 'body-27', locale),
    lint: text('tools/cli', 'body-28', locale),
    inspect: text('tools/cli', 'body-29', locale)
  }
  cli.push(text('tools/cli', 'body-30', locale),
    [text('tools/cli', 'body-31', locale), '| --- | --- | --- |',
    text('tools/cli', 'body-32', locale),
    text('tools/cli', 'body-33', locale),
    text('tools/cli', 'body-34', locale),
    text('tools/cli', 'body-35', locale)].join('\n'))
  for (const command of commandNames) {
    const editorial = cliEditorial[command]
    if (!editorial || !effects[command]) throw new Error(`Missing CLI guidance: ${command}`)
    const help = execFileSync(process.execPath, [cliBin, command, '--help'], { encoding: 'utf8', timeout: 15000 }).trim()
    const usage = help.split('\n')[0].replace(/^Usage: /, '')
    cli.push(`## master-css ${command} {#${command}}`, fence('text', usage), effects[command],
      ...(command === 'generate' ? [referenceIllustrationMarkdown('cli-output-destinations', locale)] : []),
      ...editorial.examples.flatMap(example => [example.description, fence('sh', example.command)]),
      text('tools/cli', 'command-help', locale).replaceAll('%%command%%', command),
      ...editorial.notes ?? [])
  }
  cli.push(text('tools/cli', 'body-36', locale),
    text('tools/cli', 'body-37', locale))
  return [
    document('tools/mcp', text('tools/mcp', 'title', locale), text('tools/mcp', 'description', locale), mcp, tools.map(tool => tool.name), Object.fromEntries(tools.map(tool => [tool.name, tool.name])), 'packages/mcp/src/server.ts', locale),
    document('tools/cli', text('tools/cli', 'title', locale), text('tools/cli', 'description', locale), cli, commandNames.map(name => `master-css ${name}`), Object.fromEntries(commandNames.map(name => [`master-css ${name}`, name])), 'packages/cli/src/core.ts', locale)
  ]
}

function document(id: string, title: string, description: string, sections: string[], aliases: string[], identifierAnchors: Record<string, string>, source: string, locale = 'en'): ReferenceDocument {
  const markdown = sections.join('\n\n')
  return { id, kind: 'tool', title, description, category: 'Tools', url: `/reference/${id}`, source, sourceDigest: hash(markdown), language: languageOf(locale), locale, aliases, identifierAnchors, terms: [], rows: [], examples: [], related: ['packages', 'rules/extraction'], guide: id.endsWith('mcp') ? '/guide/ai-coding#connect-the-mcp-server' : '/guide/installation#cli', markdown, headings: documentHeadings(markdown), extractionNotes: [] }
}
