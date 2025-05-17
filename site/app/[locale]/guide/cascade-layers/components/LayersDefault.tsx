import Link from 'internal/components/Link'

export default () => {
    return (
        <figure className='doc-table'>
            <table>
                <thead>
                    <tr>
                        <th className='w:0'>Layer</th>
                        <th>Description</th>
                        <th>CSS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Base</th>
                        <td>Where the styles with <code>@base</code> are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer base { … }'}</code></td>
                    </tr>
                    <tr>
                        <th>Theme</th>
                        <td>Where the used <Link href="/guide/variables">variables</Link> are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer theme { … }'}</code></td>
                    </tr>
                    <tr>
                        <th>Preset</th>
                        <td>Where the styles with <code>@preset</code> are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer preset { … }'}</code></td>
                    </tr>
                    <tr>
                        <th>Components</th>
                        <td>Where the used <Link href="/guide/components">components</Link> are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer components { … }'}</code></td>
                    </tr>
                    <tr>
                        <th>General</th>
                        <td>Where the general styles are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer general { … }'}</code></td>
                    </tr>
                </tbody>
            </table>
        </figure>
    )
}