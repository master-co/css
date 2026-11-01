import metadata from './metadata'
import Content from './content.mdx'
import ComponentPage from '../../components/ComponentPage'

export { metadata }

export default function Page() {
  return <ComponentPage kicker="Documents" title="Document patterns" description={metadata.description} sections={[]} Documentation={Content} documentationTitle={null} />
}
