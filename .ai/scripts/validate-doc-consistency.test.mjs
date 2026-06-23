import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const contextIndexPath = '.ai/context/index.md'
const guardrailHeadingPattern = /^## (?:Escalate When|Escalate Immediately|Accuracy Rule)$/m

test('AI instructions and prompts route through the context pack index', async () => {
    const files = [
        path.join(repoRoot, 'AGENTS.md'),
        ...await listMarkdownFiles(path.join(repoRoot, '.github/prompts'))
    ]
    const failures = []

    for (const eachFile of files) {
        const content = await readFile(eachFile, 'utf8')
        if (!content.includes(contextIndexPath)) {
            failures.push(`${relativePath(eachFile)} | missing ${contextIndexPath}`)
        }
    }

    assert.deepEqual(failures, [])
})

test('context packs include escalation or guardrail guidance', async () => {
    const files = await listMarkdownFiles(path.join(repoRoot, '.ai/context'))
    const failures = []

    for (const eachFile of files) {
        const content = await readFile(eachFile, 'utf8')
        if (!guardrailHeadingPattern.test(content)) {
            failures.push(`${relativePath(eachFile)} | missing escalation or guardrail heading`)
        }
    }

    assert.deepEqual(failures, [])
})

async function listMarkdownFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries
        .filter((eachEntry) => eachEntry.isFile() && eachEntry.name.endsWith('.md'))
        .map((eachEntry) => path.join(dir, eachEntry.name))
        .sort((a, b) => relativePath(a).localeCompare(relativePath(b)))
}

function relativePath(file) {
    return path.relative(repoRoot, file).split(path.sep).join('/')
}
