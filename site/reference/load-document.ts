import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ReferenceDocument } from './types'

export async function loadReferenceDocument(id: string): Promise<ReferenceDocument> {
  const filename = path.join(process.cwd(), '.generated/reference-documents', `${encodeURIComponent(id)}.json`)
  return JSON.parse(await readFile(filename, 'utf8')) as ReferenceDocument
}
