import syntaxes from '../syntaxes'
import SyntaxTable from '~/site/docs-shell/components/SyntaxTable'
import SyntaxTr from '~/site/components/SyntaxTr'

export default function Overview() {
  return <SyntaxTable>{syntaxes.map(syntax => <SyntaxTr value={syntax} key={syntax} />)}</SyntaxTable>
}
