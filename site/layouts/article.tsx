import Layout from 'internal/layouts/article'
import { footerProps } from '~/site/navigation'

export default function SiteArticleLayout(props: any) {
    return <Layout {...props} footerProps={footerProps} />
}
