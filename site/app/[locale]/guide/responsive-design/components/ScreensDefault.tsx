import { generateAt, parseAt, screens } from '@master/css'
import InlineCode from '~/internal/components/InlineCode'

export default () => {
    return (
        <div className='doc-table'>
            <table>
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
            </table>
        </div>
    )
}