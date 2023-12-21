import DocTable from 'websites/components/DocTable'

export default () => {
    return (
        <DocTable>
            <thead>
                <tr>
                    <th className='w:0'>Token</th>
                    <th className='w:0'>Pixels</th>
                    <th className='w:0'>REM</th>
                    <th>Representation</th>
                </tr>
            </thead>
            <tbody>
                {
                    Array.from({ length: 24 }, (_, index) => ({
                        token: `${index + 1}x`,
                        px: `${(index + 1) * 4}px`,
                        value: `${(index + 1) * 0.25}rem`,
                    }))
                        .map((row, index) => (
                            <tr key={index}>
                                <th>{row.token}</th>
                                <td>{row.px}</td>
                                <td>{row.value}</td>
                                <td>
                                    <div className='bg:primary inline-block h:1em v:middle' style={{ width: row.value }}></div>
                                </td>
                            </tr>
                        ))
                }
                <tr>
                    <td colSpan={4}>...</td>
                </tr>
            </tbody>
        </DocTable>
    )
}