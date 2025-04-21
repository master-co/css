import syntaxes from '../syntaxes'
import SyntaxTable from 'internal/components/SyntaxTable'
import SyntaxTr from 'internal/components/SyntaxTr'

export default () => {
    return (
        <>
            <SyntaxTable>
                {syntaxes.map((syntax) =>
                    <SyntaxTr value={syntax} key={syntax}></SyntaxTr>)
                }
            </SyntaxTable>
        </>
    )
}