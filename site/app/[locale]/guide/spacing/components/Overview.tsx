import InlineCode from '~/internal/components/InlineCode'
import { getThemeNumberVariableEntries } from '~/site/utils/theme-variables'

export default () => {
    const spacingEntries = getThemeNumberVariableEntries('spacing')

    return (
        <figure>
            <div className='doc-table'>
                <table>
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Value</th>
                            <th>(REM)</th>
                            <th>Representation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            spacingEntries
                                .map(([key, value], index) => (
                                    <tr key={index}>
                                        <th><InlineCode>{`--spacing-${key}`}</InlineCode></th>
                                        <td><InlineCode>{`${value}`}</InlineCode></td>
                                        <td>{`${value / 16}rem`}</td>
                                        <td>
                                            <div className='inline-flex bg:stripe-pink outline:1|lighter outline-offset:-1 v:middle w:fit' style={{ gap: value / 16 + 'rem' }}>
                                                {Array.from({ length: 14 - index }, (_, index) => <div key={index} className='inline-block size:1.5em bg:base'></div>)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}
