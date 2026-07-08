import Layout from 'internal/layouts/doc'
import { footerProps } from '~/site/navigation'

export default function SiteDocLayout(props: any) {
  return <Layout {...props} footerProps={footerProps} />
}
