import { readFile } from 'node:fs/promises'
import { auditTranslations, type TranslationReviews } from '@master/internal-site/build/localization.ts'
import translationResources, { missingUIKeys } from '../i18n/resources.ts'

const reviews = JSON.parse(await readFile(new URL('../i18n/reviews.json', import.meta.url), 'utf8')) as TranslationReviews
const resources = await translationResources()
const diagnostics = auditTranslations(resources, reviews)
for (const issue of diagnostics) console.error(`${issue.id} [${issue.locale}] ${issue.reason}: ${issue.message}`)
for (const [locale, keys] of Object.entries(await missingUIKeys())) {
  if (keys.length) console.error(`Missing ${locale} interface copy (${keys.length}):\n${keys.map(key => `  ${JSON.stringify(key)}`).join('\n')}`)
}
console.log(`Checked ${resources.length} local translation resources; ${diagnostics.length} problems.`)
if (diagnostics.length) process.exitCode = 1
