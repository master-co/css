import Play from './Play'

export const dynamic = 'force-static'
export const revalidate = false
import i18n from 'internal/common/i18n.config.mjs'

export async function generateStaticParams() {
    return i18n.locales.map((locale: any) => ({ locale }))
}

export default async function Page(props: any) {
    return (
        <Play />
    )
}