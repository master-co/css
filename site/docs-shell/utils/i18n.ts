import 'server-only'

export async function createTranslation(locale: string, dictionaries: Record<string, () => Promise<any>>): Promise<(text: any) => string> {
  const translations = await importTranslations(locale, dictionaries)
  return (text: any) => (translations)[text || ''] || text
}

export const importTranslations = async (locale: string, dictionaries: Record<string, () => Promise<any>>) => {
  if (!locale) {
    throw new Error('locale is required')
  }
  const load = dictionaries[locale as keyof typeof dictionaries]
  return await load()
}
