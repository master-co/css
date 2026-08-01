import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

export function argument(name, fallback) {
  const prefix = `--${name}=`
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback
}

export function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...options
  })
}

export function resolveRef(ref) {
  return git(['rev-parse', `${ref}^{commit}`]).trim()
}

export function hasRef(ref) {
  try {
    resolveRef(ref)
    return true
  } catch {
    return false
  }
}

export function isCommitAncestor(ancestor, descendant) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: process.cwd(),
      stdio: 'ignore'
    })
    return true
  } catch {
    return false
  }
}

export function resolveLatestTargetCommit() {
  return git([
    'log',
    '-1',
    '--format=%H',
    'HEAD',
    '--',
    'crates',
    'packages',
    'parity/rust-semantic-corpus.json'
  ]).trim()
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function shortDigest(value) {
  return sha256(value).slice(0, 16)
}
