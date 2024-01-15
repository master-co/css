import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import SyntaxTr from '~/components/SyntaxTr'

export default () =>
    <SyntaxTable>
        {syntaxes.map((syntax) =>
            <SyntaxTr value={syntax} key={syntax}></SyntaxTr>)
        }
    </SyntaxTable>