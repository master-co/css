import { variables } from '@master/css'

export default () => {
    return (
        <figure>
            <div className='doc-table'>
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th>Pixels</th>
                            <th>REM</th>
                            <th>Representation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            Object.entries(variables.spacing)
                                .map(([key, value], index) => (
                                    <tr key={index}>
                                        <th>{key}</th>
                                        <td>{value}px</td>
                                        <td>{value / 16}rem</td>
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