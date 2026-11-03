import { spawn, execFileSync } from 'node:child_process'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { ReferenceDocument } from './types'
import { documentHeadings } from './headings'
import { mcpEditorial, mcpPrompts, mcpResultContract } from './mcp-editorial'
import { cliEditorial } from './cli-editorial'
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

export async function buildToolContracts(repo: string): Promise<ReferenceDocument[]> {
  const mcpBin = await publicBin(repo, 'mcp', 'master-css-mcp')
  const tools = await listMCPTools(mcpBin)
  const mcp = [
    'Use the [MCP setup guide](/guide/ai-coding#connect-the-mcp-server) to connect a client to your project. Ask the connected server for `tools/list` to read its current input and output schemas. This catalog helps you choose a tool; complete registrations and schemas live in the [server source](https://github.com/master-co/css/blob/rc/packages/mcp/src/server.ts).',
    'The server uses the workspace passed to `--root`. Start with `mastercss_workspace_info` to verify the root and stylesheet entries. A connected server does not by itself establish that the intended project manifest is loaded.'
  ]
  mcp.push('## Choose a tool {#choose-a-tool}',
    ['| Question | Tools |', '| --- | --- |',
    '| Is this the intended project and setup? | [`workspace_info`](#mastercss_workspace_info), [`setup_audit`](#mastercss_setup_audit) |',
    '| Which definitions are available? | [`manifest_query`](#mastercss_manifest_query), [`inspect_directives`](#mastercss_inspect_directives) |',
    '| What does a class mean, and was it found? | [`inspect_class`](#mastercss_inspect_class), [`extract_classes`](#mastercss_extract_classes), [`trace_class`](#mastercss_trace_class), [`scan_project`](#mastercss_scan_project) |',
    '| What CSS or class syntax should I use? | [`render_css`](#mastercss_render_css), [`suggest_classes`](#mastercss_suggest_classes), [`suggest_syntax`](#mastercss_suggest_syntax) |',
    '| What changed or needs repair? | [`css_compare`](#mastercss_css_compare), [`lint_project`](#mastercss_lint_project), [`lint_content`](#mastercss_lint_content) |',
    '| How do I review and apply edits? | [`preview_fixes`](#mastercss_preview_fixes), [`preview_directive_format`](#mastercss_preview_directive_format), [`apply_preview`](#mastercss_apply_preview) |'].join('\n'),
    'The table abbreviates tool names; every protocol name below starts with `mastercss_`. Request examples show the arguments object passed to `tools/call`, not a complete JSON-RPC envelope.',
    '## Preview lifetime {#preview-lifetime}',
    referenceIllustrationMarkdown('preview-file-identity'),
    'A preview records the original file identities and proposed contents in one server process. It does not reserve a file or follow subsequent edits. A nonempty file preview returns `confirmToken` and `expiresAt`; unchanged results and in-memory formatting do not. Apply validates token lifetime, workspace containment and every original file before writing. Successful application consumes the token. Writes are sequential, so this is not a transactional rollback guarantee.',
    'Use the [AI coding workflow](/guide/ai-coding#safe-write-previews) to review a concrete change and verify the rendered result. The contract here defines what the tool accepts and writes.')
  for (const tool of tools) {
    const editorial = mcpEditorial[tool.name]
    if (!editorial) throw new Error(`Missing MCP guidance: ${tool.name}`)
    mcp.push(`## ${tool.name} {#${tool.name}}`, editorial.purpose, fence('json', JSON.stringify(editorial.example, null, 2)), editorial.lifecycle)
  }
  mcp.push('## Prompts {#prompts}',
    'Request a prompt through `prompts/get` in a connected client.',
    ['| Prompt | Use |', '| --- | --- |', ...mcpPrompts.map(prompt => `| \`${prompt.name}\` | ${prompt.use} |`)].join('\n'),
    '## Results {#results}', ...mcpResultContract)
  mcp.push('## Read the full contract',
    'Use `tools/list` in the same connected server session for accepted arguments. On GitHub, read the [tool registrations](https://github.com/master-co/css/blob/rc/packages/mcp/src/server.ts), [output schemas](https://github.com/master-co/css/blob/rc/packages/mcp/src/output-schema.ts), and [result envelope](https://github.com/master-co/css/blob/rc/packages/mcp/src/result.ts). The [workflow guide](/guide/ai-coding#safe-write-previews) shows a complete preview and apply sequence. Source links follow the `rc` branch; the connected server describes your installed version.')
  const cliBin = await publicBin(repo, 'cli', 'master-css')
  const rootHelp = execFileSync(process.execPath, [cliBin, '--help'], { encoding: 'utf8', timeout: 15000 })
  const commandNames = [...(rootHelp.split('Commands:\n')[1] ?? '').matchAll(/^ {2}([a-z][a-z-]*)(?:\s|$)/gm)].map(match => match[1]).filter(name => name !== 'help')
  if (!commandNames.length) throw new Error('No public CLI commands discovered')
  for (const name of Object.keys(cliEditorial)) if (!commandNames.includes(name)) throw new Error(`Stale CLI guidance: ${name}`)
  const cli = [
    'Install the CLI through the [setup guide](/guide/installation#cli), then run it from the project root. Generate, lint and inspect discover ordinary app sources without source arguments; explicit path arguments replace that selection. Suggest accepts a CSS declaration block.',
    'Quote source globs so the CLI, rather than the shell, expands them. These commands operate on the current working directory; only `suggest` exposes `--cwd`. [Extraction](/reference/rules/extraction) owns source parsing and [Scanning](/reference/directives/scanning) owns stylesheet source policy.',
    'Run `master-css --help` to list commands and `master-css <command> --help` to read all options for your installed version. Current command definitions live in the [CLI source](https://github.com/master-co/css/blob/rc/packages/cli/src/core.ts).'
  ]
  const effects: Record<string, string> = {
    suggest: 'Suggests classes and validates their generated declarations without editing files. Uses the active project manifest and preserves uncertain blocks as CSS. Review the cascade and browser behavior before applying a proposal.',
    generate: 'Publishes CSS and associated stylesheet resources. Use `--no-export --verbose 0` to print only CSS without publishing files. `--watch` runs until interrupted; check rebuild errors even while the process remains active.',
    lint: 'Reports class diagnostics without writing source by default. `--fix` applies supported fixes; `--fix-dry-run` returns proposals without applying them. Stdin content is never written back to its virtual path.',
    inspect: 'Reports source discovery, stylesheet entries and missing CSS without publishing CSS or rewriting source files. `--classes` checks the scan result; it does not safelist those classes. Read diagnostics and coverage before interpreting an empty result.'
  }
  cli.push('## Command effects {#command-effects}',
    ['| Command | Default output | File effects |', '| --- | --- | --- |',
    '| [`generate`](#generate) | CSS entry and required assets | Publishes output; `--no-export` prints CSS instead. |',
    '| [`lint`](#lint) | JSON diagnostics | Reads source; `--fix` writes supported fixes. |',
    '| [`inspect`](#inspect) | JSON inspection report | Reads source; shell redirection can save the report. |',
    '| [`suggest`](#suggest) | JSON declaration proposal | Reads declarations; does not apply the proposal. |'].join('\n'))
  for (const command of commandNames) {
    const editorial = cliEditorial[command]
    if (!editorial || !effects[command]) throw new Error(`Missing CLI guidance: ${command}`)
    const help = execFileSync(process.execPath, [cliBin, command, '--help'], { encoding: 'utf8', timeout: 15000 }).trim()
    const usage = help.split('\n')[0].replace(/^Usage: /, '')
    cli.push(`## master-css ${command} {#${command}}`, fence('text', usage), effects[command],
      ...(command === 'generate' ? [referenceIllustrationMarkdown('cli-output-destinations')] : []),
      ...editorial.examples.flatMap(example => [example.description, fence('sh', example.command)]),
      `Run \`master-css ${command} --help\` for every option. [Implementation](https://github.com/master-co/css/blob/rc/packages/cli/src/${command}.ts).`,
      ...editorial.notes ?? [])
  }
  cli.push('## Check results',
    'For lint and inspect, the default JSON report is written to stdout; `--format stylish` writes readable diagnostics to stderr. Diagnostic errors normally produce a nonzero exit status. `--exit-code never` suppresses diagnostic-based failure, so read the report before treating the run as successful. See [Code linting](/guide/code-linting) and [Scanning class names](/guide/scanning-and-pruning) for troubleshooting. Source links follow the `rc` branch.')
  return [
    document('tools/mcp', 'MCP tools', 'Choose a tool, understand its file effects, and find the current protocol contract.', mcp, tools.map(tool => tool.name), Object.fromEntries(tools.map(tool => [tool.name, tool.name])), 'packages/mcp/src/server.ts'),
    document('tools/cli', 'CLI commands', 'Choose a command, check its file effects, and find complete options in CLI help and source.', cli, commandNames.map(name => `master-css ${name}`), Object.fromEntries(commandNames.map(name => [`master-css ${name}`, name])), 'packages/cli/src/core.ts')
  ]
}

function document(id: string, title: string, description: string, sections: string[], aliases: string[], identifierAnchors: Record<string, string>, source: string): ReferenceDocument {
  const markdown = sections.join('\n\n')
  return { id, kind: 'tool', title, description, category: 'Tools', url: `/reference/${id}`, source, sourceDigest: hash(markdown), language: 'en', aliases, identifierAnchors, terms: [], rows: [], examples: [], related: ['packages', 'rules/extraction'], guide: id.endsWith('mcp') ? '/guide/ai-coding#connect-the-mcp-server' : '/guide/installation#cli', markdown, headings: documentHeadings(markdown), extractionNotes: [] }
}
