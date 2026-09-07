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
import { fileURLToPath } from 'node:url'

const inspectNativePackageArgument = '--inspect-native-package'
const packageDirectory = resolve(process.argv[2] || '')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function runNPM(args, options = {}) {
  return execFileSync(npmCommand, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options
  })
}

function exerciseEngineSession(binding) {
  const session = new binding.EngineSession(JSON.stringify({
    version: 1,
    variables: {
      '': [{
        name: 'stripe',
        key: 'stripe',
        type: 'string',
        value: 'linear-gradient(red,blue)'
      }]
    },
    utilities: []
  }))

  try {
    const ensured = JSON.parse(session.ensureClassRulesWithNativeSupport(['bg:stripe'], [true]))
    if (!ensured.mutations.some(({ op, target }) => op === 'insert' && target === 'theme')
      || !ensured.mutations.some(({ op, target }) => op === 'insert' && target === 'utilities')) {
      throw new Error('Native engine smoke did not emit the expected theme and utility rules.')
    }

    const registered = JSON.parse(session.registerEmittedGlobals(JSON.stringify({
      variables: { stripe: 1 }
    })))
    if (!registered.mutations.some(({ op, target }) => op === 'delete' && target === 'theme')) {
      throw new Error('Native engine smoke did not remove the host-owned theme rule.')
    }

    const snapshot = JSON.parse(session.snapshot())
    if (snapshot.text.includes('--stripe:')
      || !snapshot.text.includes('.bg\\:stripe{background:var(--stripe)}')) {
      throw new Error('Native engine smoke did not preserve the utility without local theme output.')
    }
  } finally {
    session.dispose()
  }

  try {
    session.snapshot()
  } catch {
    return
  }
  throw new Error('Native engine smoke accepted use after disposal.')
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
  exerciseEngineSession(binding)
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

function inspectNativePackageInChild(directory) {
  return JSON.parse(execFileSync(process.execPath, [
    fileURLToPath(import.meta.url),
    inspectNativePackageArgument,
    directory
  ], { encoding: 'utf8' }))
}

if (process.argv[2] === inspectNativePackageArgument) {
  writeFileSync(1, JSON.stringify(inspectNativePackage(resolve(process.argv[3] || ''))) + '\n')
  process.exit(0)
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
  const installed = inspectNativePackageInChild(installedDirectory)
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
