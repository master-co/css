import syntaxes from '../syntaxes'
import SyntaxTable from 'internal/components/SyntaxTable'
import SyntaxTr from 'internal/components/SyntaxTr'
import SyntaxPreview from './SyntaxPreview'
import Basic from './Basic'

export default () => {
    const previewSyntax = 'float:left'
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