#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { assertNativeCLIInfo, resolveNativeCLIPath } from '@master/css-native'
import runProgram from '../core'

const nodeHostCommands = new Set(['lint', 'inspect', 'extract', 'render', 'scan'])
const nodeHostFlags = new Set(['-w', '--watch', '-h', '--help', '-V', '--version'])
const args = process.argv.slice(2)
const backendIndex = args.indexOf('--backend')
const requestedBackend = backendIndex === -1
  ? process.env.MASTER_CSS_CLI_BACKEND || 'auto'
  : args[backendIndex + 1]
if (!requestedBackend || !['auto', 'native', 'wasm'].includes(requestedBackend)) {
  throw new TypeError('Master CSS CLI backend must be auto, native, or wasm.')
}
const useNodeHost = args.some((argument) => nodeHostFlags.has(argument))
  || (args[0] ? nodeHostCommands.has(args[0]) : false)
const useNative = !useNodeHost && (
  requestedBackend === 'native'
  || args.includes('--binding-info')
  || args.includes('--self-test')
)

async function runNative(executable: string) {
  const status = await new Promise<number>((resolve, reject) => {
    const child = spawn(executable, args, { stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal)
        return
      }
      resolve(code ?? 1)
    })
  })
  process.exitCode = status
}

if (useNative) {
  const nativeCLI = resolveNativeCLIPath({ required: requestedBackend === 'native' })
  if (nativeCLI) {
    assertNativeCLIInfo(nativeCLI)
    await runNative(nativeCLI)
  } else {
    await runProgram()
  }
} else {
  await runProgram()
}
