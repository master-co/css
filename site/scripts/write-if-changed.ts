import { readFile, writeFile } from 'node:fs/promises'
import { readFileSync, writeFileSync } from 'node:fs'

export async function writeIfChanged(file: string | URL, content: string) {
  try {
    if (await readFile(file, 'utf8') === content) return false
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  await writeFile(file, content)
  return true
}

export function writeIfChangedSync(file: string | URL, content: string) {
  try {
    if (readFileSync(file, 'utf8') === content) return false
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  writeFileSync(file, content)
  return true
}
