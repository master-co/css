import syntaxes from '../syntaxes'
import SyntaxTable from 'internal/components/SyntaxTable'
import SyntaxTr from '~/site/components/SyntaxTr'
import SyntaxPreview from './SyntaxPreview'

export default () => {
  const previewSyntax = 'column-span:all'
  return (
    <>
      <SyntaxTable>
        {syntaxes.map((syntax) =>
          <SyntaxTr value={syntax} key={syntax} previewSyntax={previewSyntax}></SyntaxTr>)
        }
      </SyntaxTable>
      <SyntaxPreview className={previewSyntax} />
    </>
  )
}