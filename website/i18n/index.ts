import 'server-only'

const dictionaries: { [key: string]: () => Promise<any> } = {
    en: () => import('./en.json').then((module) => module.default),
    tw: () => import('./tw.json').then((module) => module.default),
}

export async function createTranslation(locale: string): Promise<(text: any) => string> {
    const translations = await importTranslations(locale)
    return (text: any) => (translations)[text || ''] || text
}

export const importTranslations = async (locale: string) => {
    if (!locale) {
        throw new Error('locale is required')
    }
    return dictionaries[locale as keyof typeof dictionaries]()
}
