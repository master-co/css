import DocTable from 'internal/components/DocTable'
import { generateAt, parseAt, screens, variables } from '@master/css'
import InlineCode from '~/internal/components/InlineCode'

export default () => {
    return (
        <DocTable>
            <thead>
                <tr>
                    <th className='w:0'>Token</th>
                    <th className='w:0'>REM</th>
                    <th className='w:0'></th>
                    <th>CSS</th>
                </tr>
            </thead>
            <tbody>
                {
                    Object.entries(screens)
                        .map(([name, value], index) => (
                            <tr key={index}>
                                <td className="white-space:nowrap"><code>@{name}</code></td>
                                <td><InlineCode>{`${value / 16}rem`}</InlineCode></td>
                                <td><InlineCode>{`(${value}px)`}</InlineCode></td>
                                <td><InlineCode lang="css">{generateAt(parseAt('@' + name))}</InlineCode></td>
                            </tr>
                        ))
                }
            </tbody>
        </DocTable>
    )
}