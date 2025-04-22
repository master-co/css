'use server'

import NotFoundLayout from 'internal/layouts/not-found'
import RootClient from './root'
import { importTranslations } from '~/internal/utils/i18n'
import dictionaries from '../dictionaries'

export default async function NotFound() {
    const translations = await importTranslations('en', dictionaries)
    return (
        <RootClient locale='en' translations={translations} hidden>
            <NotFoundLayout dictionaries={dictionaries} />
        </RootClient>
    )
}