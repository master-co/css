import Layout from 'internal/layouts/doc'
import { footerProps } from '~/site/navigation'

export default function SiteDocLayout(props: any) {
  return <Layout {...props} className={props.metadata.pathname?.startsWith('/reference') ? 'reference-document' : props.className} footerProps={footerProps} />
}
