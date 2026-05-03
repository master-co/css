import { generateAt, parseAt, screens } from '@master/css'
import css from '~/internal/common/css'
import InlineCode from '~/internal/components/InlineCode'

const formatValue = (value: number) => `${value}px / ${value / 16}rem`

export default () => {
    return (
        <figure className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th className="w:0">Token</th>
                        <th className="w:0">Value</th>
                        <th>CSS</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        Object.entries(screens)
                            .map(([name, value]) => (
                                <tr key={name}>
                                    <th className="white-space:nowrap"><InlineCode>{`@${name}`}</InlineCode></th>
                                    <td className="white-space:nowrap"><InlineCode>{formatValue(value)}</InlineCode></td>
                                    <td><InlineCode lang="css">{generateAt(parseAt('@' + name, css))}</InlineCode></td>
                                </tr>
                            ))
                    }
                </tbody>
            </table>
        </figure>
    )
}
