import { spawn, execFileSync } from 'node:child_process'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { ReferenceDocument } from './types'
import { documentHeadings } from './headings'
import { mcpEditorial } from './mcp-editorial'
import { cliEditorial } from './cli-editorial'
import { schemaParameters, cliParameters, parametersMarkdown } from './tool-parameters'

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

export async function buildToolContracts(repo: string): Promise<ReferenceDocument[]> {
  const result: ReferenceDocument[] = []
  const mcpBin = await publicBin(repo, 'mcp', 'master-css-mcp')
  const tools = await listMCPTools(mcpBin)
  const mcpDigest = hash(await readFile(mcpBin, 'utf8'))
  for (const tool of tools) {
    const id = `tools/mcp/${tool.name}`
    const editorial = mcpEditorial[tool.name]
    if (!editorial) throw new Error(`Missing MCP editorial: ${tool.name}`)
    const parameters = schemaParameters(tool.inputSchema, editorial.fields)
    const markdown = [
      '## Contract', editorial.purpose,
      '## Input', parametersMarkdown(parameters),
      fence('json disclosure=input-schema', JSON.stringify(tool.inputSchema, null, 2)),
      '## Example', `Call \`${tool.name}\` from a connected MCP client with these arguments:`,
      fence('json name=Arguments', JSON.stringify(editorial.example, null, 2)), editorial.exampleNote,
      '## Output', editorial.output,
      'Successful calls return the same JSON in `structuredContent` and text content, with the advertised output schema, diagnostics, context, package/language/binding versions, and manifest fingerprint. Check `isError` on the tool result, then the report’s own status and diagnostics: an MCP call can succeed while reporting a project error.',
      tool.outputSchema ? fence('json disclosure=output-schema', JSON.stringify(tool.outputSchema, null, 2)) : 'The server does not advertise an output JSON Schema for this tool.',
      '## Project context and lifecycle', editorial.lifecycle,
      'The local stdio server uses the workspace passed to `--root`. Confirm the root and intended CSS entries with `mastercss_workspace_info` before relying on project-dependent values.',
      'See the [MCP workflow guide](/guide/mcp-server) for client setup and the preview/apply workflow.'
    ].join('\n\n')
    result.push({ id, kind: 'tool', title: tool.name, description: tool.description ?? tool.name, category: 'MCP tools', url: `/reference/${id}`, source: 'packages/mcp/src/server.ts', sourceDigest: mcpDigest, language: 'en', aliases: [tool.name], terms: [], rows: [], examples: [], related: ['rules/extraction'], guide: '/guide/mcp-server', markdown, headings: documentHeadings(markdown), extractionNotes: [] })
  }
  const cliBin = await publicBin(repo, 'cli', 'master-css')
  const cliDigest = hash(await readFile(cliBin, 'utf8'))
  for (const command of ['generate', 'lint', 'inspect', 'migrate']) {
    const help = execFileSync(process.execPath, [cliBin, command, '--help'], { encoding: 'utf8', timeout: 15000 }).trim()
    const id = `tools/cli/${command}`
    const editorial = cliEditorial[command]
    const usage = help.split('\n')[0].replace(/^Usage: /, '')
    const markdown = [
      '## Invocation and options', fence('text name=Invocation', usage), editorial.introduction,
      parametersMarkdown(cliParameters(help)), fence('text disclosure=command-help', help),
      '## Effects and lifecycle', editorial.effects,
      '## Output and errors', editorial.output,
      '## Example', 'Run from the project root after installing the CLI:',
      ...editorial.examples.flatMap(example => [example.description, fence('sh', example.command)]),
      'See the [CLI guide](/guide/installation/cli) for setup.'
    ].join('\n\n')
    result.push({ id, kind: 'tool', title: `master-css ${command}`, description: help.split('\n').find((line, index) => index > 0 && line.trim()) ?? command, category: 'CLI commands', url: `/reference/${id}`, source: 'packages/cli/src/core.ts', sourceDigest: cliDigest, language: 'en', aliases: [`master-css ${command}`], terms: [command], rows: [], examples: [], related: ['rules/extraction'], guide: '/guide/installation/cli', markdown, headings: documentHeadings(markdown), extractionNotes: [] })
  }
  return result
}
