import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(join(root, 'package.json'))
const records = []
for (const extension of ['js', 'mjs']) {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-bh-cli-'))
    try {
        const name = `entry.${extension}`
        writeFileSync(join(cwd, name), 'export const className = "block"')
        for (const host of ['node', 'native']) {
            for (const explicit of [true, false]) {
                const command = host === 'node' ? process.execPath : join(root, 'target/debug/mcss')
                const args = host === 'node'
                    ? ['--import', require.resolve('tsx'), join(root, 'packages/cli/src/bin/index.ts'), 'generate']
                    : []
                args.push('--no-export', ...(explicit ? [name] : []))
                const result = spawnSync(command, args, {
                    cwd, encoding: 'utf8',
                    env: { ...process.env, TSX_TSCONFIG_PATH: join(root, 'tsconfig.json') }
                })
                records.push({ host, extension, explicit, status: result.status,
                    containsBlock: result.stdout?.includes('.block{display:block}'),
                    stderr: result.stderr, wroteFile: existsSync(join(cwd, 'master.css')) })
            }
        }
    } finally {
        rmSync(cwd, { recursive: true, force: true })
    }
}
console.log(JSON.stringify(records, null, 2))
assert(records.every((r) => r.status === 0 && r.containsBlock && !r.wroteFile),
    'BH-0018: default discovery must include supported .mjs sources, as explicit paths do')
