import DocLayout from 'internal/layouts/doc'
import metadata from './metadata'

export default async function Layout(props: any) {
    return (
        <DocLayout {...props}
            metadata={metadata}
            backOnClickCategory='/guide/installation/integrations'
            brandName='svelte'
        >
            {props.children}
        </DocLayout >
    )
}