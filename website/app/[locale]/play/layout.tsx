import RootLayout from '../../root-layout'
import metadata from './metadata'
import { generate } from '~/utils/metadata'
import Script from 'next/script'
import i18n from '~/i18n.config.mjs'
import { importTranslations } from '~/i18n'

export async function generateMetadata(props: any, parent: any) {
    return await generate(metadata, props, parent)
}

export default async function Layout({ children, params }: {
    children: JSX.Element,
    params: { locale: typeof i18n['locales'][number] }
}) {
    return (
        <RootLayout locale={params.locale} translations={await importTranslations(params.locale)} bodyClassName='bg:base' style={{ display: 'none' }}>
            <>
                {children}
            </>
        </RootLayout>
    )
}

