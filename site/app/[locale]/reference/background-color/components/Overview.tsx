import SyntaxTable from '~/site/docs-shell/components/SyntaxTable'
import syntaxes from '../syntaxes'
import SyntaxTr from '~/site/components/SyntaxTr'
import Bg from '~/site/docs-shell/components/Bg'

export default () => {
  const previewSyntax = 'bg-blue-60'
  return (
    <>
      <SyntaxTable>
        {syntaxes.map((syntax) =>
          <SyntaxTr value={syntax} key={syntax} previewSyntax={previewSyntax}>
            {typeof syntax === 'string' && <Bg className={syntax} />}
          </SyntaxTr>)
        }
      </SyntaxTable>
    </>
  )
}
