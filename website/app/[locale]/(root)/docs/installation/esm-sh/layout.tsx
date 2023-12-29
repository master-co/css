import Tabs, { Tab, TabBadge } from 'websites/components/Tabs'
import { getDictionary } from 'websites/dictionaries'
import DocLayout from '~/layouts/doc'
import LogoSvg from '~/public/images/cdns/esm-sh.svg?inlineSvg'
import metadata from './metadata'

export default function Layout(props: any) {
    const $ = getDictionary(props.params.locale)
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