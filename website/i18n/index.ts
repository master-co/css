const dictionaries: Record<string, Promise<any>> = {
    en: import('./en.json'),
    tw: import('./tw.json'),
}

export async function createTranslation(locale: string): Promise<(text: any) => string> {
    const translations = await importTranslations(locale)
    return (text: any) => (translations)[text || ''] || text
}

export async function importTranslations(locale: string): Promise<any> {
    return (await dictionaries[locale]).default
}