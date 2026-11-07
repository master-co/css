import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function packagePath(cwd, pkgRoot) {
  return path.join(pkgRoot ? path.resolve(cwd, pkgRoot) : cwd, 'package.json')
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 4)}\n`)
}

/** Reads a workspace manifest; a release needs its file and name. */
export async function readPackage(cwd, pkgRoot) {
  const file = packagePath(cwd, pkgRoot)
  if (!existsSync(file)) throw new Error(`Missing package.json file: a package.json file is required at ${file}.`)
  const pkg = await readJson(file)
  if (!pkg.name) throw new Error(`Missing name property in package.json: ${file} must define a package name.`)
  return pkg
}

/** The npm dist-tag of a release channel: `latest` for main, otherwise the channel itself, such as `rc` or `site`. */
export function getChannel(channel) {
  return channel || 'latest'
}

/** Writes the release version into a workspace manifest and its npm-shrinkwrap.json, if any. */
export async function writeReleaseVersion(cwd, pkgRoot, version) {
  const file = packagePath(cwd, pkgRoot)
  const pkg = await readJson(file)
  pkg.version = version
  await writeJson(file, pkg)
  const shrinkwrap = path.join(path.dirname(file), 'npm-shrinkwrap.json')
  if (existsSync(shrinkwrap)) {
    const lock = await readJson(shrinkwrap)
    lock.version = version
    await writeJson(shrinkwrap, lock)
  }
}
