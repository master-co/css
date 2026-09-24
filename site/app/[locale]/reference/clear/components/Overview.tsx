import SyntaxTable from '~/site/docs-shell/components/SyntaxTable'
import syntaxes from '../syntaxes'
import SyntaxTr from '~/site/components/SyntaxTr'

export default () =>
  <SyntaxTable>
    {syntaxes.map((syntax) =>
      <SyntaxTr value={syntax} key={syntax}></SyntaxTr>)
    }
  </SyntaxTable>