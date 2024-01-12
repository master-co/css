import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import clsx from 'clsx'
import SyntaxTr from '~/components/SyntaxTr'
import SyntaxPreview from './SyntaxPreview'

export default () => {
    const previewSyntax = 'fg:blue'
    return (
        <>
            <SyntaxTable>
                {syntaxes.map((syntax) =>
                    <SyntaxTr value={syntax} key={syntax} previewSyntax={previewSyntax}>
                        {typeof syntax === 'string' && <span className={clsx('font:16 font:medium mr:3x v:top', syntax, { 'bg:tiny': syntax === 'fg:transparent' })}>Aa</span>}
                    </SyntaxTr>)
                }
            </SyntaxTable>
            <SyntaxPreview className={previewSyntax}></SyntaxPreview>
        </>
    )
}