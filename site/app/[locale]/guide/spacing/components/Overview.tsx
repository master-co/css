import { variables } from '@master/css'

export default () => {
    return (
        <figure>
            <div className='doc-table'>
                <table>
                    <thead>
                        <tr>
                            <th>Token</th>
                            <th className='text:center'>Pixels</th>
                            <th className='text:center'>REM</th>
                            <th>Representation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            Object.entries(variables.spacing)
                                .map(([key, value], index) => (
                                    <tr key={index}>
                                        <th>{key}</th>
                                        <td className='text:right'>{value}px</td>
                                        <td className='text:right'>{value / 16}rem</td>
                                        <td>
                                            <div className='inline-flex bg:stripe-pink w:fit outline:1|lighter outline-offset:-1 v:middle' style={{ gap: value / 16 + 'rem' }}>
                                                {Array.from({ length: 14 - index }, (_, index) => <div className='inline-block bg:base size:1.5em'></div>)}
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