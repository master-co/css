import { createTranslation } from '~/i18n'
import DocLayout from '~/layouts/reference'
import metadata from './metadata'
import brands from 'websites/data/brands'

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
            brand={brands.find(({ name }) => name === 'esm.sh')}

        >
            {props.children}
        </DocLayout >
    )
}