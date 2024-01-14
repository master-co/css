'use client'

import syntaxes from '../syntaxes'
import SyntaxTable from '~/components/SyntaxTable'
import SyntaxTr from '~/components/SyntaxTr'
import SyntaxPreview from './SyntaxPreview'

export default () => {
    const previewSyntax = 'col-span:all'
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