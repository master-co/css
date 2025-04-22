import DocLayout from 'internal/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'

export default async function Layout(props: any) {
    return (
        <DocLayout {...props}
            metadata={metadata}
            dictionaries={dictionaries}
            backOnClickCategory='/guide/installation/integrations'
            brandName='vite'
        >
            {props.children}
        </DocLayout >
    )
}