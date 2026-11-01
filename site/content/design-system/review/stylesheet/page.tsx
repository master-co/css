import metadata from './metadata'
import Content from './content.mdx'
import ComponentPage from '../../components/ComponentPage'

export { metadata }

export default function Page() {
  return <ComponentPage kicker="Documents" title="Stylesheet examples" description={metadata.description} sections={[]} Documentation={Content} documentationTitle={null} />
}
