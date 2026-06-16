import { execFileSync, type ExecFileSyncOptionsWithStringEncoding } from 'node:child_process'

export default function execPnpmSync(args: string[], options: ExecFileSyncOptionsWithStringEncoding) {
    execFileSync('pnpm', args, process.platform === 'win32' ? { ...options, shell: true } : options)
}
