import syntaxes from '../syntaxes'
import SyntaxTable from '~/site/docs-shell/components/SyntaxTable'
import SyntaxTr from '~/site/components/SyntaxTr'

export default () => {
  return (
    <>
      {[
        { id: 'all-sides', title: 'All sides', rows: syntaxes.filter(([syntax]) => syntax.startsWith('p:')) },
        { id: 'logical-sides', title: 'Logical sides', rows: syntaxes.filter(([syntax]) => /^p[xy]/.test(syntax)) },
        { id: 'physical-sides', title: 'Physical sides', rows: syntaxes.filter(([syntax]) => /^p[trbl]:/.test(syntax)) }
      ].map(group => <section key={group.id}>
        <h3 id={group.id}>{group.title}</h3>
        <SyntaxTable>{group.rows.map(syntax => <SyntaxTr value={syntax} key={syntax[0]} />)}</SyntaxTable>
      </section>)}
    </>
  )
}