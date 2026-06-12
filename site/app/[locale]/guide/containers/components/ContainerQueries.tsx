import css from '~/site/common/preset-css'
import InlineCode from '~/internal/components/InlineCode'
import { containerVariableEntries } from '~/site/utils/container-variables'
import generatePlanAt from '~/site/utils/generate-plan-at'

const formatValue = (value: number) => `${value}px / ${value / 16}rem`

export default () => {
    return (
        <figure className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th className="w:0">Variant</th>
                        <th className="w:0">Value</th>
                        <th>Generated query</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        containerVariableEntries.map(([name, value]) => (
                            <tr key={name}>
                                <th className="white-space:nowrap"><InlineCode>{`@container(${name})`}</InlineCode></th>
                                <td className="white-space:nowrap"><InlineCode>{formatValue(value)}</InlineCode></td>
                                <td><InlineCode lang="css">{generatePlanAt(css.containerAtRules.get(name))}</InlineCode></td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </figure>
    )
}
