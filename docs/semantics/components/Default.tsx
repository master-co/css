import { semantics } from '@master/css'
import InlineCode from 'shared/components/InlineCode'

export default () => <table>
    <thead>
        <tr>
            <th className="w:0">Syntax</th>
            <th>CSS Declarations</th>
        </tr>
    </thead>
    <tbody>
        {
            Object.keys(semantics)
                .map((eachSemanticName) => {
                    // @ts-ignore
                    const eachSemantic = semantics[eachSemanticName]
                    return (
                        <tr key={eachSemanticName}>
                            <td>
                                <InlineCode lang="mcss">{eachSemanticName}</InlineCode>
                            </td>
                            <td>
                                <InlineCode lang="css" className="white-space:pre">{
                                    Object.keys(eachSemantic)
                                        .map((eachSemanticKey) => {
                                            const eachSemanticValue = (eachSemantic as any)[eachSemanticKey]
                                            return `${eachSemanticKey}: ${eachSemanticValue};`
                                        })
                                        .join('\n')
                                }</InlineCode>
                            </td>
                        </tr>
                    )
                })
        }
    </tbody>
</table>