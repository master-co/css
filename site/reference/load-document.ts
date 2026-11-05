import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ReferenceRenderDocument } from './render-document'

export async function loadReferenceDocument(id: string, locale = 'en'): Promise<ReferenceRenderDocument> {
  if (!['en', 'tw', 'ja', 'ko', 'cn'].includes(locale)) throw new Error(`Unknown Reference locale: ${locale}`)
  const filename = path.join(process.cwd(), '.generated/reference-documents', locale, `${encodeURIComponent(id)}.json`)
  const document = JSON.parse(await readFile(filename, 'utf8')) as ReferenceRenderDocument
  if (document.id !== id || document.locale !== locale) throw new Error(`Mismatched Reference route payload: ${id} (${locale})`)
  return document
}
