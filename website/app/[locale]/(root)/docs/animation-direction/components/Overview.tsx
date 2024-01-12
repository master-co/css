'use client'

import syntaxes from '../syntaxes'
import SyntaxTable from '~/components/SyntaxTable'
import SyntaxTr from '~/components/SyntaxTr'

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