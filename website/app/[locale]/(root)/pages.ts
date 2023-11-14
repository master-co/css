import { Metadata } from 'websites/types/Metadata'
import path from 'upath'
// @ts-ignore
import metadataForList from './docs/*/metadata.ts'
// @ts-ignore
import allMetadata from './docs/*/**/metadata.ts'
import docsInstallationMetadata from './docs/installation/(tabs)/metadata'

metadataForList.push({
    ...docsInstallationMetadata,
    _path: './docs/installation/metadata.ts'
})

const categoryOrder = [
    'Getting Started',
    'Core Syntax',
    'Fundamentals',
    'Production Optimization',
    'Design Tokens',
    'Custom Syntax',
    'Enhanced Service',
    'API Reference',
    'CLI Reference',
]

let pages: { metadata: Metadata, pathname: string }[] = metadataForList.map((eachMetadata: Metadata) => {
    return {
        metadata: eachMetadata,
        pathname: path.dirname((eachMetadata as any)._path)
            .replace(/^./, '')
            .replace(/\/\(.*\)/g, '')
    }
})

let allPages: { metadata: Metadata, pathname: string }[] = allMetadata.map((eachMetadata: Metadata) => {
    return {
        metadata: eachMetadata,
        pathname: path.dirname((eachMetadata as any)._path)
            .replace(/^./, '')
            .replace(/\/\([^)]+\)/g, '')
    }
})

function sortPages(eachPages: any[]) {
    return eachPages
        .reduce((categories: any[], eachPage: any) => {
            const eachPageCategoryName = eachPage?.metadata?.category
            if (eachPageCategoryName) {
                const existingCategory = categories.find((eachCategory: any) => eachCategory.name === eachPageCategoryName)
                if (existingCategory) {
                    existingCategory.pages.push(eachPage)
                    existingCategory.pages.sort((a: any, b: any) => {
                        if (a.metadata.order !== undefined && b.metadata.order !== undefined) {
                            return a.metadata.order - b.metadata.order
                        } else if (a.metadata.order !== undefined) {
                            return -1
                        } else if (b.metadata.order !== undefined) {
                            return 1
                        } else {
                            return 0
                        }
                    })
                } else {
                    categories.push({ name: eachPageCategoryName, pages: [eachPage] })
                }
            }
            return categories
        }, [])
        .sort((a, b) => {
            const indexA = categoryOrder.indexOf(a.name)
            const indexB = categoryOrder.indexOf(b.name)

            if (indexA === -1 && indexB === -1) {
                return a.name.localeCompare(b.name)
            }

            if (indexA === -1) {
                return 1
            }

            if (indexB === -1) {
                return -1
            }

            return indexA - indexB
        })
}

export const pageCategories = sortPages(pages)

pages = pageCategories
    .map((eachPageCategory: any) => eachPageCategory.pages)
    .flat()

allPages = allPages.sort((a, b) => {
    const titleA = a.metadata.title.toLowerCase()
    const titleB = b.metadata.title.toLowerCase()

    if (titleA < titleB) {
        return -1
    }
    if (titleA > titleB) {
        return 1
    }
    return 0
})

export { allPages }
export default pages