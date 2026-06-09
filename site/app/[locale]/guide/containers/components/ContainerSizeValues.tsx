import InlineCode from '~/internal/components/InlineCode'
import { containerVariableEntries } from '~/site/utils/container-variables'

const formatRem = (value: number) => `${value / 16}rem`
const formatValue = (value: number) => `${value}px / ${formatRem(value)}`

export default () => {
    return (
        <figure className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th className="w:0">Value</th>
                        <th className="w:0">Token</th>
                        <th className="w:0">Size</th>
                        <th>Example utility</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        containerVariableEntries.map(([name, value]) => (
                            <tr key={name}>
                                <th className="white-space:nowrap"><InlineCode>{name}</InlineCode></th>
                                <td className="white-space:nowrap"><InlineCode>{`container-${name}`}</InlineCode></td>
                                <td className="white-space:nowrap"><InlineCode>{formatValue(value)}</InlineCode></td>
                                <td><InlineCode>{`max-w:${name}`}</InlineCode></td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </figure>
    )
}
