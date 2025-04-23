import DocLayout from 'internal/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'

export default async function Layout(props: any) {
    return (
        <DocLayout {...props}
            metadata={metadata}
            dictionaries={dictionaries}
            categoryLink='/guide/installation/integrations'
            brandName='react'
        >
            {props.children}
        </DocLayout >
    )
}