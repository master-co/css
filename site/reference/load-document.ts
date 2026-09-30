import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ReferenceRenderDocument } from './render-document'

export async function loadReferenceDocument(id: string): Promise<ReferenceRenderDocument> {
  const filename = path.join(process.cwd(), '.generated/reference-documents', `${encodeURIComponent(id)}.json`)
  return JSON.parse(await readFile(filename, 'utf8')) as ReferenceRenderDocument
}
