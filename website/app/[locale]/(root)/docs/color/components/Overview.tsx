import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import SyntaxTr from '~/components/SyntaxTr'
import SyntaxPreview from './SyntaxPreview'
import Aa from '~/components/Aa'

export default () => {
    const previewSyntax = 'fg:blue'
    return (
        <>
            <SyntaxTable>
                {syntaxes.map((syntax) =>
                    <SyntaxTr value={syntax} key={syntax} previewSyntax={previewSyntax}>
                        {typeof syntax === 'string' && <Aa className={syntax} />}
                    </SyntaxTr>)
                }
            </SyntaxTable>
            <SyntaxPreview className={previewSyntax} />
        </>
    )
}