/**
 * Local translations, by hand:
 *
 *   node --import tsx scripts/audit-i18n.ts          every problem the production gate would report
 *   node --import tsx scripts/audit-i18n.ts rehash   move unchanged reviews to the current source fingerprint
 *
 * A source fingerprint leaves out an imported component's own <style> block. Reviews recorded before that stay valid
 * while nothing they cover changes; rehash moves each one whose source and translation are exactly as reviewed to the
 * current fingerprint, so a later style change leaves it valid too. It extends no review to content nobody read.
 * Preparation and builds never call it.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { auditTranslations, rehashTranslationReviews, type TranslationReviews } from '@master/internal-site/build/localization.ts'
import translationResources, { missingUIKeys } from '../i18n/resources.ts'

const reviewsFile = new URL('../i18n/reviews.json', import.meta.url)
const [command] = process.argv.slice(2)
const reviews = JSON.parse(await readFile(reviewsFile, 'utf8')) as TranslationReviews

if (command === 'rehash') {
  const { reviews: moved, moved: count } = rehashTranslationReviews(await translationResources(), reviews)
  await writeFile(reviewsFile, JSON.stringify(moved, null, 2) + '\n')
  console.log(`Moved ${count} unchanged reviews to the current source fingerprint.`)
} else if (command === 'audit' || !command) {
  const resources = await translationResources()
  const diagnostics = auditTranslations(resources, reviews)
  for (const issue of diagnostics) console.error(`${issue.id} [${issue.locale}] ${issue.reason}: ${issue.message}`)
  for (const [locale, keys] of Object.entries(await missingUIKeys())) {
    if (keys.length) console.error(`Missing ${locale} interface copy (${keys.length}):\n${keys.map(key => `  ${JSON.stringify(key)}`).join('\n')}`)
  }
  console.log(`Checked ${resources.length} local translation resources; ${diagnostics.length} problems.`)
  if (diagnostics.length) process.exitCode = 1
} else {
  throw new Error(`Unknown command: ${command}`)
}
