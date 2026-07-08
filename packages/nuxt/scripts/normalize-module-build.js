import { access, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const distDir = 'dist'
const renames = [
  ['module.mjs', 'module.js'],
  ['module.d.mts', 'module.d.ts'],
  ['types.d.mts', 'types.d.ts']
]
const removals = [
  'module.d.cts',
  'types.d.cts'
]

async function fileExists(path) {
  try {
    await access(path)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

async function renameBuildFile(rootDir, from, to) {
  const fromPath = join(rootDir, distDir, from)
  const toPath = join(rootDir, distDir, to)

  if (!await fileExists(fromPath)) {
    if (await fileExists(toPath)) {
      return
    }
    throw new Error(`Expected Nuxt module build output ${fromPath} to exist before normalization.`)
  }

  await rm(toPath, { force: true })
  await rename(fromPath, toPath)
}

async function replaceModuleSpecifier(rootDir, file) {
  const filePath = join(rootDir, distDir, file)
  const source = await readFile(filePath, 'utf8')
  const nextSource = source.replaceAll('./module.mjs', './module.js')
  if (nextSource !== source) {
    await writeFile(filePath, nextSource)
  }
}

export async function normalizeNuxtModuleBuild(rootDir = process.cwd()) {
  for (const [from, to] of renames) {
    await renameBuildFile(rootDir, from, to)
  }
  await Promise.all(removals.map((file) => rm(join(rootDir, distDir, file), { force: true })))

  await Promise.all([
    replaceModuleSpecifier(rootDir, 'module.d.ts'),
    replaceModuleSpecifier(rootDir, 'types.d.ts')
  ])
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isCli) {
  await normalizeNuxtModuleBuild()
}
