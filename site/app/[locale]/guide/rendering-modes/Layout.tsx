import DocLayout from 'internal/layouts/doc'
import metadata from './metadata'
import { createTranslation } from 'internal/utils/i18n'

export default async function Layout(props: any) {
    const { locale } = await props.params
    const $ = createTranslation(locale)
    return (
        <DocLayout {...props} metadata={metadata} toc={props.toc}>
            <p className='italic'>It&#39;s flexible — can be runtime, zero-runtime, or even hydration.</p>
            {props.children}
        </DocLayout >
    )
}