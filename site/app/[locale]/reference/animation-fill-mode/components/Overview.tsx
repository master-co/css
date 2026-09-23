import SyntaxTable from 'internal/components/SyntaxTable'
import SyntaxTr from '~/site/components/SyntaxTr'
import syntaxes from '../syntaxes'

export default function Overview() {
  return <SyntaxTable>{syntaxes.map(syntax => <SyntaxTr key={String(syntax)} value={syntax} />)}</SyntaxTable>
}
