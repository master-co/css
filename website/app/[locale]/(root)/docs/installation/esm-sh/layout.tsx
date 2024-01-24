import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { createTranslation } from '~/i18n'
import DocLayout from '~/layouts/reference'
import LogoSvg from '~/public/images/cdns/esm-sh.svg?inlineSvg'
import metadata from './metadata'

export default async function Layout(props: any) {
    const $ = await createTranslation(props.params.locale)
    return (
        <DocLayout {...props}
            metadata={{
                title: 'Launch Master CSS using esm.sh',
                description: metadata.description,
                category: metadata.category
            }}
            backOnClickCategory='/docs/installation'
            icon={<LogoSvg width={64} />}
            titleBig
        >
            {props.children}
        </DocLayout >
    )
}