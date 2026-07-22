import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const packageDirectory = resolve(process.argv[2] || '')
const packageJSON = JSON.parse(readFileSync(resolve(packageDirectory, 'package.json'), 'utf8'))
const executableName = process.platform === 'win32' ? 'mcss.exe' : 'mcss'
const binding = createRequire(import.meta.url)(resolve(packageDirectory, 'mastercss.node'))
const bindingInfo = JSON.parse(binding.bindingInfoJson())
const selfTest = JSON.parse(execFileSync(resolve(packageDirectory, executableName), ['--self-test'], {
  encoding: 'utf8'
}))

if (bindingInfo.bindingAbiVersion !== selfTest.binary.bindingAbiVersion) {
  throw new Error('Native addon and CLI ABI versions do not match.')
}
if (bindingInfo.packageVersion !== selfTest.binary.packageVersion) {
  throw new Error('Native addon and CLI package versions do not match.')
}
if (bindingInfo.target !== selfTest.binary.target) {
  throw new Error('Native addon and CLI targets do not match.')
}
if (!packageJSON.files.includes('mastercss.node') || !packageJSON.files.includes(executableName)) {
  throw new Error('Native target package omits a required artifact.')
}

process.stdout.write(JSON.stringify({ package: packageJSON.name, binding: bindingInfo, selfTest }) + '\n')
