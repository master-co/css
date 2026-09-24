import FastGlob from 'fast-glob'
import { AbsoluteTemplateString } from 'next/dist/lib/metadata/types/metadata-types'
import { dirname, join, resolve } from 'path'
import { DefinedMetadata } from '../docs-shell/types/Metadata'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

const { default: units } = await import(resolve('./units'))
const metadataPaths = FastGlob.sync('./app/[locale]/**/*metadata.ts')
  .filter((metadataPath) => existsSync(join(dirname(metadataPath), 'page.tsx')))
const pages = await Promise.all(
  metadataPaths
    .map(async (metadataPath) => {
      const { default: metadata } = await import(resolve(metadataPath))
      return metadata
    })
)

const pageFilename = resolve(`.pages.json`)
writeFileSync(pageFilename, JSON.stringify(pages, null, 4))
console.log(`產生 ${pageFilename} (${pages.length} pages)`)

if (!existsSync(resolve('.categories'))) {
  mkdirSync(resolve('.categories'))
}

let resolvedCount = 0

for (const name in units) {
  const unit = units[name]
  const categories = pages
    .filter(({ pathname }) => pathname.startsWith('/' + name + '/') || (pathname === '/' + name))
    .sort((a, b) => {
      const titleA = ((a.title as AbsoluteTemplateString)?.absolute || a.title as string).toLowerCase()
      const titleB = ((b.title as AbsoluteTemplateString)?.absolute || b.title as string).toLowerCase()
      return titleA.localeCompare(titleB)
    })
    .reduce((categories: { name: string, pages: DefinedMetadata[] }[], eachPage: any) => {
      const eachPageCategoryName = eachPage?.category
      if (eachPageCategoryName) {
        const existingCategory = categories.find((eachCategory: any) => eachCategory.name === eachPageCategoryName)
        if (existingCategory) {
          existingCategory.pages.push(eachPage)
          existingCategory.pages.sort((a: any, b: any) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order
            } else if (a.order !== undefined) {
              return -1
            } else if (b.order !== undefined) {
              return 1
            } else {
              const titleA = a.other?.subject ?? ((a.title)?.absolute || a.title as string).toLowerCase()
              const titleB = b.other?.subject ?? ((b.title)?.absolute || b.title as string).toLowerCase()
              return titleA.localeCompare(titleB)                        }
          })
        } else {
          categories.push({ name: eachPageCategoryName, pages: [eachPage] })
        }
      }
      return categories
    }, [])
    .sort((a, b) => {
      const indexA = unit.categories.indexOf(a.name)
      const indexB = unit.categories.indexOf(b.name)
      if (indexA === -1 && indexB === -1) a.name.localeCompare(b.name)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  const categoryFilename = resolve(`.categories/${name}.json`)
  writeFileSync(categoryFilename, JSON.stringify(categories, null, 4))
  console.log(`產生 ${categoryFilename} (${categories.length} categories)`)
  resolvedCount = resolvedCount + categories.length
}

console.log('')

if (resolvedCount === 0) {
  throw new Error('No categories resolved', {
    cause: pages
  })
}
