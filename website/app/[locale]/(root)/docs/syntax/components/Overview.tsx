import SyntaxTable from '~/components/SyntaxTable'
import SyntaxTr from '~/components/SyntaxTr'
// @ts-ignore
import allSyntaxes from '../../../docs/*/**/syntaxes.ts'

const syntaxes = (allSyntaxes as any[])
    .flat()
    .filter((eachSyntax: any) => typeof eachSyntax === 'string'
        ? !eachSyntax.match(/.*(-(5|10|20|30|40|50|60|70|80|90|95))$/)
        : true)

export default () => {
    return (
        <>
            <SyntaxTable scrollY={false}>
                {syntaxes.map((syntax) =>
                    <SyntaxTr value={syntax} key={syntax}></SyntaxTr>)
                }
            </SyntaxTable>
        </>
    )
}