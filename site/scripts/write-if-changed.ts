import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

export async function writeIfChanged(file: string | URL, content: string) {
  try {
    if (await readFile(file, 'utf8') === content) return false
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  await mkdir(dirname(file instanceof URL ? fileURLToPath(file) : file), { recursive: true })
  await writeFile(file, content)
  return true
}

export function writeIfChangedSync(file: string | URL, content: string) {
  try {
    if (readFileSync(file, 'utf8') === content) return false
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  mkdirSync(dirname(file instanceof URL ? fileURLToPath(file) : file), { recursive: true })
  writeFileSync(file, content)
  return true
}
