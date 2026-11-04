import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverDocumentResources, sharedInterfaceKeys, type TranslationResource } from '@master/internal-site/build/localization.ts'
import { locales } from '@master/internal-site/common/locales.js'
import sharedTranslations from '@master/internal-site/common/translations.js'
import { referenceCopyResources } from '../reference/copy.ts'
import { componentTexts, translationKeys } from '../scripts/component-text.ts'
import units from '../units.ts'

const siteRoot = fileURLToPath(new URL('../', import.meta.url))
const properties = new Set(['title', 'description', 'body', 'caption', 'detail', 'label', 'hint', 'placeholder'])
const attributes = new Set(['alt', 'aria-label', 'title', 'placeholder'])

async function sourceFiles(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await sourceFiles(filename))
    else if (/\.(?:astro|svelte|ts)$/.test(entry.name) && !/\.(?:test|spec)\./.test(entry.name)) result.push(filename)
  }
  return result
}

export async function productUIKeys() {
  const keys = new Set<string>(Object.values(units).flatMap(unit => 'categories' in unit ? [...unit.categories] : []))
  for (const key of ['Utility', 'Rule', 'Tokens', 'Directive', 'Tool', 'Package']) keys.add(key)
  const catalogSources = ['navigation.ts', 'utils/guide-overview.ts', 'utils/installation-guides.ts', 'utils/migration-guides.ts'].map(file => path.join(siteRoot, file))
  const files = [...await sourceFiles(path.join(siteRoot, 'content')), ...await sourceFiles(path.join(siteRoot, 'components')), path.join(siteRoot, 'app-config.ts'), path.join(siteRoot, 'scripts/generate-llms-txt.ts'), ...catalogSources]
  for (const filename of files) {
    if (filename.includes('/content/reference/') || filename.includes('/content/examples/')) continue
    const source = await readFile(filename, 'utf8')
    for (const key of translationKeys(source)) keys.add(key)
    if (filename.endsWith('/generate-llms-txt.ts')) {
      const description = source.match(/const PROJECT_DESC\s*=\s*\n?\s*'([^']+)'/)?.[1]
      if (description) keys.add(description)
    }
    // These modules supply dynamic t(tile.title), t(mode.body), etc. Executable
    // article specimens and their sample text are intentionally not UI catalogs.
    if (filename.includes('/content/components/') && filename.endsWith('-content.ts')) {
      for (const item of componentTexts(filename, { properties, attributes })) if (item.text.trim()) keys.add(item.text)
    }
    if (catalogSources.includes(filename)) {
      for (const item of componentTexts(filename, { properties: new Set(['name', 'title', 'description']), attributes: new Set() })) {
        if (['name', 'title', 'description'].includes(item.kind) && item.text.trim()) keys.add(item.text)
      }
    }
    if (filename === path.join(siteRoot, 'content/page.astro')) {
      for (const item of componentTexts(filename, { properties: new Set(['absolute', 'description']), attributes: new Set() })) {
        if (item.kind === 'absolute' || item.kind === 'description') keys.add(item.text)
      }
    }
  }
  for (const key of JSON.parse(await readFile(path.join(siteRoot, '.generated/benchmark-ui.json'), 'utf8'))) keys.add(key)
  return [...keys].filter(key => key.trim()).sort()
}

function dictionaryResource(id: string, keys: string[], dictionaries: Record<string, Record<string, string>>): TranslationResource {
  return {
    id,
    source: JSON.stringify(Object.fromEntries(keys.map(key => [key, key]))),
    translations: Object.fromEntries(locales.filter(locale => locale !== 'en').map(locale => [locale,
      keys.every(key => dictionaries[locale]?.[key]?.trim())
        ? JSON.stringify(Object.fromEntries(keys.map(key => [key, dictionaries[locale][key]])))
        : undefined
    ]))
  }
}

export async function missingUIKeys() {
  const keys = await productUIKeys()
  const dictionaries = Object.fromEntries(await Promise.all(locales.map(async locale => [locale, JSON.parse(await readFile(path.join(siteRoot, 'public/dictionaries', `${locale}.json`), 'utf8'))])))
  return Object.fromEntries(locales.filter(locale => locale !== 'en').map(locale => [locale, keys.filter(key => !dictionaries[locale]?.[key]?.trim() && !sharedTranslations[locale]?.[key]?.trim())]))
}

export default async function translationResources(): Promise<TranslationResource[]> {
  const keys = await productUIKeys()
  const dictionaries = Object.fromEntries(await Promise.all(locales.map(async locale => [locale, { ...sharedTranslations[locale], ...JSON.parse(await readFile(path.join(siteRoot, 'public/dictionaries', `${locale}.json`), 'utf8')) }])))
  return [
    ...await discoverDocumentResources({ contentRoot: path.join(siteRoot, 'content') }),
    ...referenceCopyResources(siteRoot, locales),
    dictionaryResource('ui/product', keys, dictionaries),
    dictionaryResource('ui/shared', [...new Set([...Object.keys(sharedTranslations.en), ...await sharedInterfaceKeys()])], sharedTranslations)
  ]
}
