import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterEach, describe, expect, it } from 'vitest'
import MasterCSSMCPContext from '../src/context'
import { createMasterCSSMCPServer } from '../src/server'

const tempDirs: string[] = []

function createTempDir(prefix: string) {
    const dir = mkdtempSync(join(tmpdir(), prefix))
    tempDirs.push(dir)
    return dir
}

async function connect(root: string) {
    const instance = createMasterCSSMCPServer({ root })
    const client = new Client({ name: 'master-css-mcp-test', version: '0.0.0' }, { capabilities: {} })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await Promise.all([
        instance.server.connect(serverTransport),
        client.connect(clientTransport)
    ])
    return {
        client,
        instance,
        async close() {
            await client.close()
            await instance.server.close()
        }
    }
}

function parseToolJSON(result: Awaited<ReturnType<Client['callTool']>>) {
    if (!('content' in result)) throw new Error('Expected callTool content result.')
    const content = (result as { content: { type: string, text?: string }[] }).content[0]
    if (!content || content.type !== 'text') throw new Error('Expected text content.')
    try {
        return JSON.parse(content.text || '') as any
    } catch (error) {
        throw new Error(`Expected JSON tool result, received: ${content.text}`)
    }
}

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        rmSync(dir, { recursive: true, force: true })
    }
})

describe('@master/css-mcp', () => {
    it('registers tools, resources, prompts, and renders CSS through MCP', async () => {
        const root = createTempDir('master-css-mcp-basic-')
        const connection = await connect(root)
        try {
            const tools = await connection.client.listTools()
            expect(tools.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining([
                'mastercss_workspace_info',
                'mastercss_render_css',
                'mastercss_preview_fixes',
                'mastercss_apply_preview'
            ]))

            const prompts = await connection.client.listPrompts()
            expect(prompts.prompts.map((prompt) => prompt.name)).toContain('debug-missing-css')

            const resource = await connection.client.readResource({ uri: 'mastercss://workspace/manifest' })
            expect(resource.contents[0]).toEqual(expect.objectContaining({
                mimeType: 'application/json'
            }))

            const rendered = parseToolJSON(await connection.client.callTool({
                name: 'mastercss_render_css',
                arguments: {
                    classList: 'block'
                }
            }))
            expect(rendered.classes).toEqual(['block'])
            expect(rendered.css.text).toContain('display:block')
        } finally {
            await connection.close()
        }
    })

    it('previews and applies lint fixes only with a confirmation token', async () => {
        const root = createTempDir('master-css-mcp-fix-')
        const file = join(root, 'index.html')
        writeFileSync(file, '<div class="fg:white m:2x"></div>')

        const connection = await connect(root)
        try {
            const preview = parseToolJSON(await connection.client.callTool({
                name: 'mastercss_preview_fixes',
                arguments: {
                    patterns: ['index.html']
                }
            }))

            expect(preview.mode).toBe('lint-fixes')
            expect(preview.preview.confirmToken).toEqual(expect.any(String))
            expect(preview.preview.changes).toHaveLength(1)
            expect(readFileSync(file, 'utf8')).toBe('<div class="fg:white m:2x"></div>')

            const applied = parseToolJSON(await connection.client.callTool({
                name: 'mastercss_apply_preview',
                arguments: {
                    confirmToken: preview.preview.confirmToken
                }
            }))
            expect(applied.applied).toBe(true)
            expect(readFileSync(file, 'utf8')).not.toBe('<div class="fg:white m:2x"></div>')
        } finally {
            await connection.close()
        }
    })

    it('lints cjs files with the shared script language mapping', async () => {
        const root = createTempDir('master-css-mcp-cjs-')
        writeFileSync(join(root, 'component.cjs'), 'const view = <div className="fg:white m:2x" />')

        const connection = await connect(root)
        try {
            const report = parseToolJSON(await connection.client.callTool({
                name: 'mastercss_lint_project',
                arguments: {
                    patterns: ['component.cjs']
                }
            }))

            expect(report.files).toHaveLength(1)
            expect(report.files[0].languageId).toBe('javascript')
            expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
                code: 'invalid-class-order'
            }))
        } finally {
            await connection.close()
        }
    })

    it('rejects root escape patterns and stale preview writes', async () => {
        const root = createTempDir('master-css-mcp-safety-')
        const file = join(root, 'index.html')
        writeFileSync(file, '<div class="block"></div>')
        const context = new MasterCSSMCPContext({ root })

        expect(() => context.validateGlobPatterns(['../outside.html'])).toThrow('escape')

        const preview = await context.createPreview([
            {
                filePath: resolve(root, 'index.html'),
                afterText: '<div class="inline"></div>'
            }
        ])
        expect(preview.confirmToken).toEqual(expect.any(String))
        writeFileSync(file, '<div class="flex"></div>')
        await expect(context.applyPreview(preview.confirmToken!)).rejects.toThrow('changed')
        expect(readFileSync(file, 'utf8')).toBe('<div class="flex"></div>')
    })
})
