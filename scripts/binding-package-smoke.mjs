import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'

const packageDirectory = resolve(process.argv[2] || '')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function runNPM(args, options = {}) {
  return execFileSync(npmCommand, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options
  })
}

function inspectNativePackage(directory) {
  const packageJSON = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'))
  if (packageJSON.bin !== undefined) {
    throw new Error('Native target package must keep the mcss executable loader-private.')
  }
  const executableRelativePath = packageJSON.os?.includes('win32') ? 'mcss.exe' : 'mcss'
  const executableName = basename(executableRelativePath)
  if (!packageJSON.files?.includes('mastercss.node') || !packageJSON.files.includes(executableName)) {
    throw new Error('Native target package omits a required artifact.')
  }

  const binding = createRequire(import.meta.url)(resolve(directory, 'mastercss.node'))
  const bindingInfo = JSON.parse(binding.bindingInfoJson())
  const selfTest = JSON.parse(execFileSync(resolve(directory, executableRelativePath), ['--self-test'], {
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

  return { packageJSON, bindingInfo, selfTest }
}

function copyPackageForPacking(sourceDirectory, targetDirectory, packageJSON, version) {
  mkdirSync(targetDirectory, { recursive: true })
  writeFileSync(
    resolve(targetDirectory, 'package.json'),
    `${JSON.stringify({ ...packageJSON, version }, null, 2)}\n`
  )
  for (const file of packageJSON.files) {
    const target = resolve(targetDirectory, file)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(resolve(sourceDirectory, file), target)
  }
}

const source = inspectNativePackage(packageDirectory)
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'mastercss-binding-package-smoke-'))

try {
  const packageSourceDirectory = resolve(temporaryDirectory, 'source')
  const installDirectory = resolve(temporaryDirectory, 'install')
  const npmEnvironment = {
    ...process.env,
    NPM_CONFIG_CACHE: resolve(temporaryDirectory, 'npm-cache')
  }
  const version = source.packageJSON.version || source.bindingInfo.packageVersion
  copyPackageForPacking(packageDirectory, packageSourceDirectory, source.packageJSON, version)

  const packResult = JSON.parse(runNPM([
    'pack',
    packageSourceDirectory,
    '--json',
    '--pack-destination',
    temporaryDirectory
  ], { cwd: packageSourceDirectory, env: npmEnvironment }))[0]
  const tarballPath = resolve(temporaryDirectory, packResult.filename)
  mkdirSync(installDirectory, { recursive: true })
  writeFileSync(resolve(installDirectory, 'package.json'), '{"private":true}\n')
  runNPM([
    'install',
    '--prefix',
    installDirectory,
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    tarballPath
  ], { cwd: installDirectory, env: npmEnvironment })

  const installedDirectory = resolve(installDirectory, 'node_modules', source.packageJSON.name)
  const installed = inspectNativePackage(installedDirectory)
  if (installed.packageJSON.version !== version) {
    throw new Error('Installed native target package version does not match its tarball.')
  }
  if (installed.bindingInfo.packageVersion !== source.bindingInfo.packageVersion) {
    throw new Error('Installed native binding metadata differs from the staged artifact.')
  }

  process.stdout.write(JSON.stringify({
    package: source.packageJSON.name,
    binding: source.bindingInfo,
    selfTest: source.selfTest,
    tarball: {
      filename: packResult.filename,
      size: packResult.size,
      integrity: packResult.integrity
    },
    installed: {
      version: installed.packageJSON.version,
      binding: installed.bindingInfo,
      selfTest: installed.selfTest
    }
  }) + '\n')
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
