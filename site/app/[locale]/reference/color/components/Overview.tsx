import SyntaxTable from 'internal/components/SyntaxTable'
import syntaxes from '../syntaxes'
import SyntaxTr from '~/site/components/SyntaxTr'
import SyntaxPreview from './SyntaxPreview'
import Aa from 'internal/components/Aa'

export default () => {
  const previewSyntax = 'fg:blue-60'
  return (
    <>
      <SyntaxTable>
        {syntaxes.map((syntax) =>
          <SyntaxTr value={syntax} key={syntax} previewSyntax={previewSyntax}>
            {typeof syntax === 'string' && <Aa className={syntax} />}
          </SyntaxTr>)
        }
      </SyntaxTable>
    </>
  )
}
