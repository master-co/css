import { Fragment } from 'react'
import ExpandContent from './ExpandContent'

export default function SyntaxTable({ title, value, children, addedLabels, ...props }: any) {
  const Container = children.length > 16 ? ExpandContent : Fragment
  return (
    <figure>
      <Container>
        <div className='doc-table'>
          <table>
            <thead>
              <tr>
                <th className="sticky-th">{title || 'Class'}</th>
                <th className="sticky-th">Declarations</th>
                {addedLabels && addedLabels.map((label: string) => <th key={label} className="sticky-th">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {children}
            </tbody>
          </table>
        </div>
      </Container>
    </figure>)
}