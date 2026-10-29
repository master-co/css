import { execFileSync, type ExecFileSyncOptionsWithStringEncoding } from 'node:child_process'

export default function execBunSync(args: string[], options: ExecFileSyncOptionsWithStringEncoding) {
  execFileSync('bun', args, process.platform === 'win32' ? { ...options, shell: true } : options)
}
