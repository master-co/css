import { importTranslations } from '~/i18n'
import RootLayout from './root-layout'
import i18n from '~/i18n.config.mjs'
import SearchButton from 'websites/components/SearchButton'
import DocHeader from '~/components/DocHeader'
import { createTranslation } from '~/i18n'
import { headers } from 'next/headers'

export default async function NotFound() {
    const headersList = headers()
    const domain = headersList.get('x-forwarded-proto') + '://' + headersList.get('host')
    const referer = headersList.get('referer')
    let locale = referer?.replace(domain, '')?.split('/')?.[1]
    locale = i18n.locales.find((eachLocale) => eachLocale === locale) || 'en'
    const $ = await createTranslation(locale)
    return (
        <RootLayout bodyClassName='bg:base' locale={locale} translations={await importTranslations(locale)} style={{ display: 'none' }}>
            <DocHeader />
            <div className="center-content flex flex:col min-h:100dvh pt:50 pt:60@md px:10x">
                <h3 className='fg:accent font:18 ls:.01em mb:5x mt:12x text:center'>404</h3>
                <h1 className='fg:strong font:32 font:48@sm font:extrabold lh:1.2 ls:-.4 mt:0 text:center'>{$('This page does not exist')}</h1>
                <div className='mb:12x p:4x|2x'>
                    <p className='text:18 fg:light'>{$('Sorry, the page cannot be found. Please try searching for other content.')}</p>
                    <SearchButton className="flex align-items:center fg:lightest rounded b:1|frame lh:3rem min-w:60x mt:10x mx:auto pointer-events:auto px:6x" />
                </div>
            </div>
        </RootLayout>
    )
}
